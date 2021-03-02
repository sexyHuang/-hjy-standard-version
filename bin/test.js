const execa = require("execa");

const test = async () => {
  const { stdout } = await execa("git", ["ls-remote"]);
  console.log(stdout);
};

test();
