# electron-forge-publisher-google-storage

Google Cloud Storage publisher for Electron Forge.

**IMPORTANT:** This has only been tested with `electron-forge` v5 as v6 is still in beta and not released to `npm`.

## Usage

Example config:

```js
"forge": {
  "googleCloudStorage": {
    "bucket": "download.domain.com",
    "public": true
  }
}
```

## License

MIT
