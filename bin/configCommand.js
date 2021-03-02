const { Command } = require("commander");
const { error, warning, info } = require("./log");
const fs = require("fs");
const path = require("path");

const configPath = path.resolve(__dirname, "./../config/index.json");
const configCopyPath = path.resolve(__dirname, "./../config/default.json");

function copyFile(src, dist) {
  fs.writeFileSync(dist, fs.readFileSync(src));
}
const actions = ["get", "set", "delete", "list"];

const scripts = {
  get(key) {
    const config = require("./../config/index.json");

    if (key) {
      info(`${config[key]}`);
    } else {
      for ([key, value] of Object.entries(config)) {
        info(`${key} = "${value}"`);
      }
    }
  },
  list() {
    const config = require("./../config/index.json");
    for ([key, value] of Object.entries(config)) {
      info(`${key} = "${value}"`);
    }
  },
  set(key, value) {
    if (!key) {
      error("请输入key");
      process.exit(0);
    }
    if (!value) {
      error("请输入value");
      process.exit(0);
    }
    if (!fs.existsSync(configCopyPath)) copyFile(configPath, configCopyPath);
    const config = require("./../config/index.json");
    fs.writeFileSync(
      configPath,
      JSON.stringify({ ...config, ...{ [key]: value } }, null, 2),
      { encoding: "utf-8" }
    );
  },
  delete(key) {
    if (!key) {
      error("请输入key");
      process.exit(0);
    }
    const config = require("./../config/index.json");
    if (!fs.existsSync(configCopyPath)) {
      warning("无自定义配置。");
      process.exit(0);
    }
    const defaultConfig = require("./../config/default.json");

    if (!config[key]) {
      warning("配置中不存在该值。");
      process.exit(0);
    }
    const { [key]: _delete, ...res } = config;

    fs.writeFileSync(
      configPath,
      JSON.stringify({ ...defaultConfig, ...res }, null, 2)
    );
  },
};

const configCommand = new Command("config");
configCommand
  .arguments("<action> [key] [value]")
  .description("修改/查看配置", {
    action: `操作：(${actions.join("|")})`,
    key: "配置项key",
    value: "配置项值",
  })
  .action(async (action, key, value) => {
    if (!actions.includes(action)) {
      error("请输入合法的操作");
      process.exit(0);
    }
    await scripts[action](key, value);
  });

module.exports = configCommand;
