const {extract} = require("reffy/extract-webidl");
const {parse} = require("reffy/parse-webidl");
const fs = require("fs");

const base_mdn_url = "https://developer.mozilla.org/docs/Web/API/";

const bcd_template = fs.readFileSync(__dirname + "/skeleton.json", "utf-8");

const propertiesFirst = (a,b) => a.type === b.type ? a.name.localeCompare(b.name) :  (a.type === "attribute" ? -1 : 1);

const loadBCD = path => {
  const file = fs.readFileSync(path, 'utf-8');
  return JSON.parse(file);
};

const listExistingBCD = () => {
  const existingBCD = {};
  fs.readdirSync('.')
    .filter(p => p.match(/\.json$/))
    .forEach(path => {
      const bcd = loadBCD(path);
      if (bcd.api) {
        existingBCD[Object.keys(bcd.api)[0]] = path;
      } else {
        console.error(path + " has a bogus format");
      }
    });
  return existingBCD;
}

// compare data in existing files with extracted data
const augmentExistingBCD = (existingbcd, webidlbcd) => {
  const diffs = Object.keys(webidlbcd).filter(m => !existingbcd[m]);
  diffs
    .forEach(m => existingbcd[m] = webidlbcd[m]);
  return diffs.length > 0;
  // TODO: detect issues the other way around
};

// --non-standard option to mark WebIDL extracted from non-standard track documents
const nonStandard = (process.argv[2] == "--non-standard");

const urls = process.argv.slice(nonStandard ? 3 : 2);
if (!urls.length) {
  console.log("Usage: " + process.argv.slice(0,2).join(" ") + " [--non-standard] url1 [url2...]");
  process.exit(2);
}

const buildBCD = function (interface, name) {
  const bcd = {};
  bcd.__compat = JSON.parse(bcd_template);
  bcd.__compat.mdn_url = base_mdn_url + interface + (name ? "/" + name : "");
  if (nonStandard) {
    bcd.__compat.status.standard_track = false;
  }
  return bcd;
}

const existingBCD = listExistingBCD();
urls.forEach(url => extract(url)
             .then(parse)
             .catch(err => {console.error(err); return {idlNames:{}, idlExtendedNames: {}};})
             .then(({idlNames, idlExtendedNames}) => {
               const interfaces = {...idlNames};
               Object.keys(idlExtendedNames).forEach(i => {
                 idlExtendedNames[i].forEach(ext => {
                   if (!interfaces[ext.name]) {
                     interfaces[ext.name] = {...ext};
                   } else {
                     interfaces[ext.name].members = (interfaces[ext.name].members || []).concat(ext.members);
                   }
                 });
               });
               // TODO: check that interface mixin should indeed be treated as interfaces in MDN
               Object.keys(interfaces).filter(n => ["interface", "interface mixin"].includes(interfaces[n].type) && (interfaces[n].extAttrs.length === 0 || !interfaces[n].extAttrs.find(ea => ea.name === "NoInterfaceObject")))
                 .forEach(interface => {
                   const bcd = {api:{}};
                   bcd.api[interface] = buildBCD(interface);
                   // add constructor(s) first
                   if (interfaces.extAttrs) {
                     if (interfaces.extAttrs.find(ea => ea.name === "Constructor")) {
                       bcd.api[interface][interface] = buildBCD(interface, interface);
                     }
                     const namedconstructor = interfaces.extAttrs.find(ea => ea.name === "NamedConstructor");
                     if (namedconstructor) {
                       const name = namedconstructor.rhs.value;
                       bcd.api[interface][name] = buildBCD(interface, name);
                     }
                   }
                   // TODO: check if extended / included interface members should be added here
                   interfaces[interface].members.filter(m => m.name && m.type !== "const")
                     .sort(propertiesFirst)
                     .forEach(m => {
                       bcd.api[interface][m.name] = buildBCD(interface, m.name);
                     });
                   if (existingBCD[interface]) {
                     const existing = loadBCD(existingBCD[interface]);
                     if (augmentExistingBCD(existing.api[interface], bcd.api[interface])) {
                       fs.writeFileSync(existingBCD[interface], JSON.stringify(existing, null, 2) + "\n");
                     }
                   } else {
                     fs.writeFileSync(interface + ".json", JSON.stringify(bcd, null, 2) + "\n");
                   }
                 });
             })
            );
