# electron-forge-publisher-google-storage

Google Cloud Storage publisher for Electron Forge.

The publisher will upload the newly compiled application to `<bucket>/<platform>/<application>` path. It will also upload a manifest JSON file with the latest version number and path to the downloadable file under the platform path for easier auto-update logic.

This publisher supports `electron-forge@6`.

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
