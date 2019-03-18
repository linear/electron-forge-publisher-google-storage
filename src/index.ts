import { Storage } from "@google-cloud/storage";
import * as path from "path";

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
  const storage = new Storage({ projectId: config ? config.projectId : undefined });

  if (!config || !config.bucket) {
    throw 'In order to publish to Google Cloud Storage you must set the "googleCloudStorage.bucket" property in your forge config. See the docs for more info'; // eslint-disable-line
  }
  const bucket = storage.bucket(config.bucket);

  await Promise.all(
    artifacts.map(async artifact => {
      const [uploadedFile, response] = await bucket.upload(artifact, {
        gzip: true,
        destination: `${packageJSON.version}/${platform}-${arch}/${path.basename(artifact)}`,
      });
      if (config.public) {
        await uploadedFile.makePublic();
      }
    })
  );
};
