#!/usr/bin/env node

const { program } = require("commander");
const { prompt } = require("inquirer");

const { version } = require("./../package.json");
const execa = require("execa");
const configCommand = require("./configCommand");

const standardVersion = require("standard-version");
const { getConfiguration } = require("standard-version/lib/configuration");
const { error, info, success } = require("./lib/log");
const getContent = require("./lib/getContent");

const package = getContent();
const svConfig = getConfiguration();

const releaseTypes = ["major", "minor", "patch", "first-release", "prerelease"];

const prereleasePrefixes = ["alpha", "beta", "custom"];
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
    type: "list",
    name: "prerelease",
    when({ releaseType }) {
      return releaseType === "prerelease";
    },
    message: "请选择prerelease类型",
    choices: prereleasePrefixes,
    default: prereleasePrefixes[0],
  },
  {
    type: "input",
    name: "customPrereleasePrefix",
    message: "请输入prerelease前缀",
    when({ prerelease }) {
      return prerelease === "custom";
    },
    validate(input) {
      return input ? true : "请输入prerelease前缀!";
    },
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
  return new RegExp(svConfig.legalBranch).test(currentBranch);
};

// const standardVersion = join(
//   __dirname,
//   "./../node_modules/.bin/standard-version"
// );

const tagScript = async () => {
  let {
    releaseType,
    message,
    prerelease,
    customPrereleasePrefix,
  } = await prompt(promptList);
  let config = {};
  if (releaseType === "first-release")
    config = {
      firstRelease: true,
    };
  else if (releaseType === "prerelease") {
    if (prerelease === "custom") {
      prerelease = customPrereleasePrefix;
    }
    config = {
      prerelease,
    };
  } else {
    config = {
      releaseAs: releaseType,
    };
  }

  await standardVersion({
    ...svConfig,
    releaseCommitMessageFormat: messageTransformer(message),
    silent: true,
    ...config,
  });
  const { version } = getContent();
  success(`tagging release ${version}`);
  return prerelease;
};
const pushScript = async (currentBranch) => {
  if (!(await isSetRemote())) {
    error("未配置远程仓库！");
    process.exit();
  }
  info("开始推送到远程仓库...");
  // await execa("git", ["push"], { stdio: "inherit" });
  await execa("git", ["push", "--follow-tags", "origin", currentBranch], {
    stdio: "inherit",
  });
  success("完成推送");
};

const publishScript = async (prerelease) => {
  info("开始发布...");
  if (prerelease) {
    await execa("npm", ["publish", "--tag", prerelease], { stdio: "inherit" });
  } else {
    await execa("npm", ["publish"], { stdio: "inherit" });
  }
};

program
  .version(version, "-v, --version", "cli的版本")
  .option("-i, --ignore", "忽略分支检查")
  .option("-p, --push", "推送到远程")
  .option("--publish", "发布到npm")
  .option("--only-push", "只推送到远程")
  .addCommand(configCommand)
  .action(async (options) => {
    const { ignore, push, onlyPush, publish } = { ...svConfig, ...options };
    const currentBranch = await getCurrentBranch();

    if (!isLegalBranch(currentBranch, ignore)) {
      error("不能在该分支上进行tag操作。");
      info("可通过sv config set legalBranch <BranchName>命令进行配置");
      process.exit(0);
    }
    let prerelease;
    if (!onlyPush) prerelease = await tagScript();

    if (onlyPush || push) await pushScript(currentBranch);
    if (!onlyPush && publish && !package.private) {
      if (!push) {
        info("该发布版本代码还未推送至远程仓库");
      }
      await publishScript(prerelease);
    }
  })
  .parseAsync(process.argv);
