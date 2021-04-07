const fs = require("fs");
const { resolve } = require("path");

module.exports = () => {
  const pkgPath = resolve(process.cwd(), "package.json");
  const package = fs.readFileSync(pkgPath, "utf8");
  return package;
};
