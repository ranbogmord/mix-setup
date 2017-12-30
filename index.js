#!/usr/bin/env node

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');

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

  if (!fs.existsSync(mixConfigPath)) {
    console.log("webpack.mix.js not found, creating");
    let mixContent = "const mix = require('laravel-mix');\n\n";
    fs.writeFileSync(mixConfigPath, mixContent);
  }

  console.log("All set to go, edit 'webpack.mix.js' and run 'npm run watch'");
  return true;
};

setupMix();
