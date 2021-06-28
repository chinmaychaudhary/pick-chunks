const express = require('express');
const next = require('next');
const argParser = require('commander');
const { resolve } = require('path');
const { cyanBright, greenBright, bold, gray } = require('chalk');
const open = require('open');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const run = async () => {
  argParser.option('-r, --root <root>', 'path to source directory of project', './');
  argParser.option('-p, --port <port>', 'port to run interface on', (value, def) => {
    const port = parseInt(value);
    if (isNaN(port) || port < 1000) {
      return def;
    }
    return port;
  }, 3000);
  argParser.parse();

  const args = argParser.opts();
  if (args.root === undefined) {
    args.root = './';
  }

  const resolvedRoot = resolve(process.cwd(), args.root);

  await app.prepare();

  const server = express();

  server.all('*', (req, res) => {
    if (req.path === "/args/root") {
        return res.send(resolvedRoot);
    }
    return handle(req, res);
  });

  server.listen(args.port, () => {
    const baseRoute = `http://localhost:${args.port}`;
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
