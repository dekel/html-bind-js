const fs = require("fs");
const UglifyJS = require("uglify-es");

let packageObject;

const appName = getAppName();
const version = getVersion();
const homepageURL = getHomepageURL();

const SRC_FOLDER = "./src";
const DIST_FOLDER = "./dist";

uglifyProject();

copyCSS();


function uglifyProject() {
  const file1 = fs.readFileSync(SRC_FOLDER + "/html-bind.js", {
    encoding: "utf-8",
  });
  // console.log(file1);
  const code = {
    "html-bind.js": file1,
  };

  const options = {
    // toplevel: true,
    // compress: {
    //     global_defs: {
    //         "@console.log": "alert"
    //     },
    //     passes: 2
    // },
    output: {
      beautify: false,
      preamble: `/*
${appName} - ${version}
${homepageURL}
*/`,
    },
    sourceMap: {
      filename: "html-bind.js",
      url: "html-bind.js.map",
    },
  };

  const result = UglifyJS.minify(code, options);

  if (result.error) throw result.error;

  // console.log(result);

  // Create target directory:
  if (!fs.existsSync(DIST_FOLDER)) {
    fs.mkdirSync(DIST_FOLDER);
  }

  // Write JS File
  fs.writeFileSync(DIST_FOLDER + "/html-bind.min.js", result.code, {
    encoding: "utf-8",
  });

  // Write Map File
  fs.writeFileSync(DIST_FOLDER + "/html-bind.js.map", result.map, {
    encoding: "utf-8",
  });

}

function copyCSS() {
  fs.copyFileSync(SRC_FOLDER + "/html-bind.css", DIST_FOLDER + "/html-bind.css");

  // {
  //   encoding: "utf-8",
  // });
}

function getAppName() {
  return getPackageFile().name;
}
function getVersion() {
  return getPackageFile().version;
}
function getHomepageURL() {
  return getPackageFile().homepage;
}

function getPackageFile() {
  if (!packageObject) {
    try {
      const file = fs.readFileSync("./package.json", { encoding: "utf-8" });

      packageObject = JSON.parse(file);
    } catch (err) {
      throw ("Unable to find the package.json file", err);
    }
  }
  return packageObject;
}
