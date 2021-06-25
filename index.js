const express = require('express');
const next = require('next');
const argParser = require('commander');
const { resolve } = require('path');
const { cyanBright, greenBright, bold, gray } = require('chalk');

const dev = process.env.NODE_ENV !== 'production';
const app = next({
    dev: false,
});
const handle = app.getRequestHandler();

const run = async () => {
  argParser.option('-r, --root <root>', 'path to source directory of project', './');
  argParser.parse();

  const args = argParser.opts();
  if (args.root === undefined) {
    args.root = './';
  }

  const resolvedRoot = resolve(process.cwd(), args.root);

  await app.prepare();

  const server = express();

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(3000, () => {
    const baseRoute = 'http://localhost:3000';
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
  });
};

run();
