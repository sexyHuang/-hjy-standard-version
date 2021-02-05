#!/usr/bin/env node

const { program } = require("commander");
const { prompt } = require("inquirer");
const { join } = require("path");
const { version } = require("./../package.json");
const execa = require("execa");

const releaseTypes = ["major", "minor", "patch", "first-release"];
const getNowStr = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};
const messageTransformer = (input) => {
  const nowStr = getNowStr();
  return `chore(release): ${input.replace(/\$Date/, nowStr)}`;
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
    message: "请输入commit message( $Date 为当前日期占位符)",
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
  .action(async () => {
    const { releaseType, message } = await prompt(promptList);

    if (releaseTypes === "first-release")
      execa(
        standardVersion,
        ["-f", "--releaseCommitMessageFormat", messageTransformer(message)],
        { stdio: "inherit" }
      );
    else
      execa(
        standardVersion,
        [
          "-r",
          releaseType,
          "--releaseCommitMessageFormat",
          messageTransformer(message),
        ],
        { stdio: "inherit" }
      );

    execa("git", ["push", "origin", "--tags"]);
  })
  .parseAsync(process.argv);
