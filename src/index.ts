import { Storage } from "@google-cloud/storage";
import * as path from "path";
import * as fs from "fs";
import { file } from "tmp-promise";

export interface PublisherConfig {
  /** Google Cloud project ID */
  projectId?: string;
  /** Google Cloud storage bucket */
  bucket: string;
  /** Alternative download URL if using CNAME over Cloud Storage domain. */
  storageUrl?: string;
  /** Make uploaded artifacts and manifest public (default: false) */
  public?: boolean;
}

export default async ({
  artifacts,
  forgeConfig,
  platform,
  packageJSON
}: {
  artifacts: string[];
  packageJSON: {
    version: string;
  };
  forgeConfig: {
    googleCloudStorage?: PublisherConfig;
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
  const version = packageJSON.version;
  let downloadPath = "";

  // Upload artifacts - Manifest only supports one for now
  await Promise.all(
    artifacts.map(async artifact => {
      const destination = `${platform}/${path.basename(artifact)}`;
      const [uploadedFile, res] = await bucket.upload(artifact, {
        gzip: true,
        destination,
        metadata: {
          "cache-control": "public, max-age=31536000" // 1 year
        }
      });

      const storageUrl =
        config.storageUrl || `https://storage.googleapis.com/${bucket.name}`;
      downloadPath = `${storageUrl}/${destination}`;

      if (config.public) {
        await uploadedFile.makePublic();
      }
    })
  );

  // Upload manifest file
  const manifestContent = JSON.stringify({
    version: version,
    url: downloadPath,
    publishedAt: new Date().toISOString()
  });
  const tmpFile = await file();
  fs.writeFileSync(tmpFile.path, manifestContent);
  const [uploadedManifest, res] = await bucket.upload(tmpFile.path, {
    gzip: true,
    destination: `${platform}/manifest.json`,
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
