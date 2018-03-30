This tool extracts WebIDL fragments from specifications and generate skeleton of [MDN Browser Compatibility Data](https://github.com/mdn/browser-compat-data) for APIs.

# Usage
`node extract.js [--non-standard] url1 [url2...]`

Parse WebIDL out of a list of specs at the said URLs, and generate or update Browser Compatibility Data based on the WebIDL in these specifications. To be run in a checkout of [`browser-compat-data/api`](https://github.com/mdn/browser-compat-data/tree/master/api).

The `--non-standard` flag marks the features as `standard: false` in the relevant `status` properties.

# Install
`npm install`