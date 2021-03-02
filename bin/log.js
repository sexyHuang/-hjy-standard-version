const chalk = require("chalk");

const error = (...text) => console.log(chalk.bold.red("[!] Error: ", ...text));
const warning = (...text) => console.log(chalk.keyword("orange")(...text));

const info = (...text) => console.log(chalk.cyan(...text));

module.exports = {
  error,
  warning,
  info,
};
