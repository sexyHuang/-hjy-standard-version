const execa = require("execa");

const test = async () => {
  const { stdout } = await execa("git", ["branch", "--show-current"]);
  console.log(stdout);
};

test();
