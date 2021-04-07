const path = require("path");
const findUp = require("find-up");
const { readFileSync } = require("fs");
const _config = require("../config/index.json");
const CONFIGURATION_FILES = [".svrc", ".svrc.json"];
module.exports.getConfiguration = function () {
  const configPath = findUp.sync(CONFIGURATION_FILES);
  if (!configPath) {
    return _config;
  }
  const config = JSON.parse(readFileSync(configPath));
  return { ..._config, ...config };
};
