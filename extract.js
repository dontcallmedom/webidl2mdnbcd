const {extract} = require("reffy/extract-webidl");
const {parse} = require("reffy/parse-webidl");
const fs = require("fs");

const skeleton = {
  api: {}
};

const base_mdn_url = "https://developer.mozilla.org/docs/Web/API/";

const bcd_skeleton = {
    mdn_url:  "",
    support: {
      "webview_android": {
        "version_added": null
      },
      "chrome": {
        "version_added": null
      },
      "chrome_android": {
        "version_added": null
      },
      "edge": {
        "version_added": null
      },
      "edge_mobile": {
        "version_added": null
      },
      "firefox": {
        "version_added": null
      },
      "firefox_android": {
        "version_added": null
      },
      "ie": {
        "version_added": null
      },
      "opera": {
        "version_added": null
      },
      "opera_android": {
        "version_added": null
      },
      "safari": {
        "version_added": null
      },
      "safari_ios": {
        "version_added": null
      }
    },
    "status": {
      "experimental": false,
      "standard_track": true,
      "deprecated": false
    }
};

extract(process.argv[2])
  .then(parse)
  .then(({idlNames}) => {
    Object.keys(idlNames).filter(n => idlNames[n].type === "interface")
      .forEach(interface => {
        const bcd = {...skeleton};
        bcd.api[interface] = {};
        bcd.api[interface].__compat = {...bcd_skeleton};
        bcd.api[interface].__compat.mdn_url = base_mdn_url + interface;
        idlNames[interface].members.filter(m => m.name)
          .forEach(m => {
            bcd.api[interface][m.name] = {};
            bcd.api[interface][m.name].__compat = {...bcd_skeleton};
            bcd.api[interface][m.name].__compat.mdn_url = base_mdn_url + interface + "/" + m.name;
          });
        fs.writeFileSync(interface + ".json", JSON.stringify(bcd, null, 2));
      });

  });
