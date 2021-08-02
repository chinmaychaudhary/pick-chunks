#!/usr/bin/env node

const express = require('express');
const next = require('next');
const argParser = require('commander');
const { resolve, dirname } = require('path');
const { cyanBright, greenBright, bold, gray } = require('chalk');
const open = require('open');

const app = next({ dev: false, dir: dirname(require.resolve('@devxm/pick-chunks')) });
const handle = app.getRequestHandler();
const DEFAULT_CONFIG_PATH = 'pick-chunks.config.js';

const importConfig = (configPath) => {
  try {
    const resolvedPath = resolve(process.cwd(), configPath);
    return require(resolvedPath);
  } catch (err) {
    if (configPath !== DEFAULT_CONFIG_PATH) {
      console.warn(`⚠️ Configuration "${configPath}" not found`);
    }
    return {};
  }
};

const run = async () => {
  argParser.option('-r, --root <root>', 'path to source directory of project');
  argParser.option('-c, --config <config>', 'path to configuration', DEFAULT_CONFIG_PATH);
  argParser.option('-p, --port <port>', 'port to run interface on', (value) => {
    const port = parseInt(value);
    if (isNaN(port) || port < 1000) {
      return undefined;
    }
    return port;
  });

  argParser.parse();

  const args = argParser.opts();

  // Remove undefined arguments
  Object.keys(args).forEach((arg) => {
    if (args[arg] === undefined) {
      delete args[arg];
    }
  });

  const options = {
    ...importConfig(args.config),
    ...args,
  };

  if (options.root === undefined) {
    options.root = './';
  }

  if (options.port === undefined) {
    options.port = 3000;
  }

  const resolvedRoot = resolve(process.cwd(), options.root);
  const resolvedConfigPath = resolve(process.cwd(), options.config);
  const baseRoute = `http://localhost:${options.port}`;

  await app.prepare();

  const server = express();

  server.use('*', (req, _, next) => {
    req.srcDir = resolvedRoot;
    req.configPath = resolvedConfigPath;
    next();
  });

  server.all('*', (req, res) => {
    if (req.path === '/version') {
      return res.send(require('./package.json').version);
    }
    return handle(req, res);
  });

  server.listen(options.port, () => {
    console.clear();
    console.log(`\n${bold('Pick Chunks')}\n`);
    console.log(`${greenBright('Root')} : ${resolvedRoot}`);
    console.log(`${greenBright('Served At')} : ${cyanBright(`${baseRoute}/`)}`);
    console.log(`${greenBright('API Routes')} :`);
    console.log(
      ` - ${bold('GET')}  ${cyanBright(`${baseRoute}/api/files`)} :\n   ${gray('Lists all JS/TS/TSX files in root')}`
    );
    console.log(
      ` - ${bold('POST')} ${cyanBright(`${baseRoute}/api/chunks`)} :\n   ${gray(
        'Gives list of chunks and dependency tree for given file'
      )}\n`
    );

    open(baseRoute);
  });
};

run();
