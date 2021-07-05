const express = require('express');
const next = require('next');
const argParser = require('commander');
const { resolve } = require('path');
const { cyanBright, greenBright, bold, gray } = require('chalk');
const open = require('open');
const { existsSync } = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
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
  argParser.option('-r, --root <root>', 'path to source directory of project', './');
  argParser.option('-c, --config <config>', 'path to configuration', DEFAULT_CONFIG_PATH);
  argParser.option(
    '-p, --port <port>',
    'port to run interface on',
    (value, def) => {
      const port = parseInt(value);
      if (isNaN(port) || port < 1000) {
        return def;
      }
      return port;
    },
    3000
  );

  argParser.parse();

  const args = argParser.opts();
  const options = {
    ...importConfig(args.config),
    ...args,
  };

  if (options.root === undefined) {
    options.root = './';
  }

  const resolvedRoot = resolve(process.cwd(), options.root);
  const resolvedConfigPath = resolve(process.cwd(), options.config);
  const baseRoute = `http://localhost:${options.port}`;

  await app.prepare();

  const server = express();

  server.use('*', (req, _, next) => {
    req.srcDir = resolvedRoot;
    if (existsSync(resolvedConfigPath)) {
      req.configPath = resolvedConfigPath;
    }
    next();
  });

  server.all('*', (req, res) => {
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
