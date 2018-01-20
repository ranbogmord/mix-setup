#!/usr/bin/env node

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');
const program = require('commander');
const pkgjson = require("./package");

program
  .version(pkgjson.version)
  .usage('[options] [path]')
  .option('-o, --output <path>', 'Path mix should be setup in')
  .option('--no-scripts', 'Do not include scripts')
  .parse(process.argv);

let pathToUse = "";

if(program.output || program.args.length > 0) {
  if(program.output) {
    pathToUse = program.output;
  } else {
    pathToUse = program.args[0];
  }

  if(!fs.existsSync(pathToUse)) {
    console.log("Error: " + pathToUse + " does not exist.");
    process.exit(1);
  }

  let stat = fs.statSync(pathToUse);
  if(!stat.isDirectory()) {
    console.log("Error: " + pathToUse + " is not a directory.");
    process.exit(1);
  }

  process.chdir(pathToUse);
}

const currentDir = process.cwd();
const packagePath = `${currentDir}/package.json`;
const mixConfigPath = `${currentDir}/webpack.mix.js`;

const setupMix = async () => {
  if (!fs.existsSync(packagePath)) {
    console.log("package.json not found, initializing new package.");
    await exec('npm init -y');
  }

  console.log("Installing laravel-mix");
  await exec('npm i -D cross-env laravel-mix');

  if(program.scripts) {
    console.log("Setting up commands");

    let content = fs.readFileSync(packagePath);
    let pack = JSON.parse(content);

    pack = Object.assign(pack, {
      scripts: {
        dev: "npm run development",
        development: "cross-env NODE_ENV=development node_modules/webpack/bin/webpack.js --progress --hide-modules --config=node_modules/laravel-mix/setup/webpack.config.js",
        watch: "cross-env NODE_ENV=development node_modules/webpack/bin/webpack.js --watch --progress --hide-modules --config=node_modules/laravel-mix/setup/webpack.config.js",
        "watch-poll": "npm run watch -- --watch-poll",
        hot: "cross-env NODE_ENV=development node_modules/webpack-dev-server/bin/webpack-dev-server.js --inline --hot --config=node_modules/laravel-mix/setup/webpack.config.js",
        prod: "npm run production",
        production: "cross-env NODE_ENV=production node_modules/webpack/bin/webpack.js --no-progress --hide-modules --config=node_modules/laravel-mix/setup/webpack.config.js"
      }
    });

    content = JSON.stringify(pack, null, 2);
    fs.writeFileSync(packagePath, content);
  }

  if (!fs.existsSync(mixConfigPath)) {
    console.log("webpack.mix.js not found, creating");
    let mixContent = "const mix = require('laravel-mix');\n\n";
    fs.writeFileSync(mixConfigPath, mixContent);
  }

  console.log("All set to go, edit 'webpack.mix.js' and run 'npm run watch'");
  return true;
};

setupMix();
