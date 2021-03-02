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

const isSetRemote = async () => {
  try {
    await execa("git", ["ls-remote"]);
    return true;
  } catch (e) {
    return false;
  }
};

const getCurrentBranch = async () =>
  (await execa("git", ["branch", "--show-current"])).stdout;

const isLegalBranch = (currentBranch, ignore) => {
  if (ignore) return true;
  return new RegExp(config.legalBranch).test(currentBranch);
};

const standardVersion = join(
  __dirname,
  "./../node_modules/.bin/standard-version"
);

const tagScript = async () => {
  const { releaseType, message } = await prompt(promptList);

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
};
const pushScript = async (currentBranch) => {
  if (!(await isSetRemote())) {
    error("未配置远程仓库！");
    process.exit();
  }

  await execa("git", ["push"], { stdio: "inherit" });
  await execa("git", ["push", "--follow-tags", "origin", currentBranch], {
    stdio: "inherit",
  });
};
program
  .version(version, "-v, --version", "cli的版本")
  .option("-i, --ignore", "忽略分支检查")
  .option("-p, --push", "推送到远程")
  .option("--only-push", "只推送到远程")
  .addCommand(configCommand)
  .action(async ({ ignore, push, onlyPush }) => {
    const currentBranch = await getCurrentBranch();

    if (!isLegalBranch(currentBranch, ignore)) {
      error("不能在该分支上进行tag操作。");
      info("可通过sv config set legalBranch <BranchName>命令进行配置");
      process.exit(0);
    }

    if (!onlyPush) await tagScript();

    if (onlyPush || push) await pushScript(currentBranch);
  })
  .parseAsync(process.argv);
