# electron-forge-publisher-google-storage

Google Cloud Storage publisher for Electron Forge.

The publisher will upload the newly compiled application to `<bucket>/<platform>/<version>` path. It will also upload a manifest JSON file with the latest version number and path to the downloadable file under the platform path for easier auto-update logic.

**IMPORTANT:** This has only been tested with `electron-forge` v5 as v6 is still in beta and not released to `npm`.

## Usage

Example config:

```js
"forge": {
  "googleCloudStorage": {
    "projectId": "project-1",
    "bucket": "download.domain.com",
    "storageUrl": "https://download.domain.com"
    "public": true
  }
}
```

`storageUrl` is optional and meant to be used with CNAME'd Google Cloud Storage buckets.

## License

MIT
