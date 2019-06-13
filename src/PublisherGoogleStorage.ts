import { Storage } from "@google-cloud/storage";
import PublisherBase, {
  PublisherOptions
} from "@electron-forge/publisher-base";
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

export default class PublisherGoogleStorage {
  config: PublisherConfig;
  providedPlatforms?: string[];

  constructor(config: PublisherConfig, providedPlatforms?: string[]) {
    this.config = config;
    this.providedPlatforms = providedPlatforms;
  }

  get platforms() {
    return this.providedPlatforms || ["win32", "linux", "darwin", "mas"];
  }

  get name() {
    return "googleStorage";
  }

  async publish({ makeResults }: PublisherOptions) {
    const { config } = this;
    const artifacts: {
      path: string;
      keyPrefix: string;
      platform: string;
      arch: string;
    }[] = [];

    for (const makeResult of makeResults) {
      artifacts.push(
        ...makeResult.artifacts.map(artifact => ({
          path: artifact,
          platform: makeResult.platform,
          arch: makeResult.arch
        }))
      );
    }

    const storage = new Storage({
      projectId: config ? config.projectId : undefined
    });

    if (!config || !config.bucket) {
      throw 'In order to publish to Google Cloud Storage you must set the "googleCloudStorage.bucket" property in your forge config. See the docs for more info'; // eslint-disable-line
    }
    const bucket = storage.bucket(config.bucket);
    const version = makeResults[0].packageJSON.version;
    const platform = makeResults[0].packageJSON.version;
    let downloadPath = "";

    // Upload artifacts - Manifest only supports one for now
    await Promise.all(
      artifacts.map(async artifact => {
        const destination = `${artifact.platform}/${path.basename(
          artifact.path
        )}`;
        const [uploadedFile, res] = await bucket.upload(artifact.path, {
          gzip: true,
          destination,
          metadata: {
            "cache-control": "public, max-age=31536000" // 1 year
          },
          public: config.public
        });

        const storageUrl =
          config.storageUrl || `https://storage.googleapis.com/${bucket.name}`;
        downloadPath = `${storageUrl}/${destination}`;
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
      },
      public: config.public
    });

    tmpFile.cleanup();
  }
}
