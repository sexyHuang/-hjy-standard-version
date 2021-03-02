#!/usr/bin/env node

const { program } = require("commander");
const { prompt } = require("inquirer");
const { join } = require("path");
const { version } = require("./../package.json");
const execa = require("execa");
const configCommand = require("./configCommand");
const config = require("../config/index.json");
const { error, info } = require("./log");

const releaseTypes = ["major", "minor", "patch", "first-release"];
const getNowStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};
const messageTransformer = (input) => {
  const nowStr = getNowStr();
  return `chore(release): ${input
    .replace(/\$Date/, nowStr)
    .replace(/\$Version/, "{{currentTag}}")}`;
};
const promptList = [
  {
    type: "list",
    name: "releaseType",
    message: "请选择release类型",
    choices: releaseTypes,
    default: releaseTypes[2],
  },
  {
    type: "input",
    name: "message",
    message:
      "请输入commit message( $Date 为当前日期占位符,$Version 为当前版本占位符)",
    transformer: messageTransformer,
    validate(input) {
      return input ? true : "请输入commit message!";
    },
  },
];

const standardVersion = join(
  __dirname,
  "./../node_modules/.bin/standard-version"
);
program
  .version(version, "-v, --version", "cli的版本")
  .addCommand(configCommand)
  .action(async () => {
    const { releaseType, message } = await prompt(promptList);
    const { stdout: currentBranch } = await execa("git", [
      "branch",
      "--show-current",
    ]);

    if (!new RegExp(config.legalBranch).test(currentBranch)) {
      error("不能在该分支上进行tag操作。");
      info("可通过sv config set legalBranch <BranchName>命令进行配置");
      process.exit(0);
    }
    if (releaseType === "first-release")
      await execa(
        standardVersion,
        [
          "--releaseCommitMessageFormat",
          messageTransformer(message),
          "--first-release",
        ],
        { stdio: "inherit" }
      );
    else
      await execa(
        standardVersion,
        [
          "-r",
          releaseType,
          "--releaseCommitMessageFormat",
          messageTransformer(message),
        ],
        { stdio: "inherit" }
      );
    execa("git", ["push"], { stdio: "inherit" });
    execa("git", ["push", "origin", "--tags"], { stdio: "inherit" });
  })
  .parseAsync(process.argv);
