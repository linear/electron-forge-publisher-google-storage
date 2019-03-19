import { Storage } from "@google-cloud/storage";
import * as path from "path";
import * as fs from "fs";
import { file } from "tmp-promise";

export default async ({
  artifacts,
  forgeConfig,
  platform,
  arch,
  packageJSON,
  ...restConfig
}: {
  artifacts: string[];
  packageJSON: {
    version: string;
  };
  forgeConfig: {
    googleCloudStorage?: {
      projectId?: string;
      bucket: string;
      public?: boolean;
    };
  };
  platform: string;
  arch: string;
}) => {
  const config = forgeConfig.googleCloudStorage;
  const storage = new Storage({
    projectId: config ? config.projectId : undefined
  });

  if (!config || !config.bucket) {
    throw 'In order to publish to Google Cloud Storage you must set the "googleCloudStorage.bucket" property in your forge config. See the docs for more info'; // eslint-disable-line
  }
  const bucket = storage.bucket(config.bucket);
  const platformPath = `${platform}-${arch}`;
  const version = packageJSON.version;
  let downloadPath = "";

  // Upload artifacts - Manifest only supports one for now
  await Promise.all(
    artifacts.map(async artifact => {
      const destination = `${platformPath}/${version}/${path.basename(
        artifact
      )}`;
      const [uploadedFile, res] = await bucket.upload(artifact, {
        gzip: true,
        destination: `${platformPath}/${version}/${path.basename(artifact)}`,
        metadata: {
          "cache-control": "public, max-age=31536000" // 1 year
        }
      });
      downloadPath = `https://storage.googleapis.com/${
        bucket.name
      }/${destination}`;
      if (config.public) {
        await uploadedFile.makePublic();
      }
    })
  );

  // Upload manifest file
  const manifestContent = JSON.stringify({
    latestVersion: version,
    file: downloadPath
  });
  const tmpFile = await file();
  fs.writeFileSync(tmpFile.path, manifestContent);
  const [uploadedManifest, res] = await bucket.upload(tmpFile.path, {
    gzip: true,
    destination: `${platformPath}/manifest.json`,
    contentType: "application/json",
    metadata: {
      "cache-control": "public, max-age=60" // 1 minute
    }
  });
  if (config.public) {
    await uploadedManifest.makePublic();
  }

  tmpFile.cleanup();
};
