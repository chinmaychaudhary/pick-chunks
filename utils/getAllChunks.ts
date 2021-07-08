import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname, relative } from 'path';

let store: Record<string, any> = {};
const extensions = ['.js', '.ts', '.tsx'];

export const clearStore = () => {
  store = {};
};

export const getAllChunks = (path: string, root: string): Record<string, any> => {
  path = resolve(root, path);
  if (store[path] === null) {
    return Promise.resolve({
      path,
      children: [],
      chunks: new Set(),
      isCyclic: true,
    });
  }

  if (store[path] !== undefined) {
    return Promise.resolve(store[path]);
  }

  store[path] = null;

  const cwd = dirname(path);
  const staticImports: string[] = [];
  const dynamicImports = new Set();
  const dynamicImportsChunkNames: any = {};

  const code = readFileSync(path).toString();
  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript', 'classProperties', 'exportDefaultFrom'],
  });

  traverse(ast, {
    ImportDeclaration(path: any) {
      staticImports.push(path.node.source.value);
    },
    CallExpression(path: any) {
      if (path.node.callee.type === 'Import') {
        const comments = path.node.arguments[0].leadingComments;
        const filePath = path.node.arguments[0].value;
        if (comments && comments.length == 1) {
          const chunkNameComment = comments[0].value.replace("'", '"');
          if (chunkNameComment.includes('webpackChunkName')) {
            dynamicImportsChunkNames[filePath] = chunkNameComment.split('"')[1];
          }
        }
        dynamicImports.add(filePath);
      }
    },
    ExportNamedDeclaration(path: any) {
      if (!!path.node.source) {
        staticImports.push(path.node.source.value);
      }
    },
    ExportAllDeclaration(path: any) {
      if (!!path.node.source) {
        staticImports.push(path.node.source.value);
      }
    },
  });

  const chunks = new Map();
  dynamicImports.forEach((chunk) => {
    let chunkPath: any = chunk;
    for (const extension of extensions) {
      if (!chunkPath.endsWith(extension)) {
        chunkPath += extension;
      }

      const pathToChunk = resolve(cwd, chunkPath);
      const pathToChunkWithRoot = resolve(root, chunkPath);

      const isRelative = existsSync(pathToChunk);
      const isFromRoot = existsSync(pathToChunkWithRoot);

      if (!isRelative && !isFromRoot) {
        chunkPath = chunk;
        continue;
      }

      if (isRelative) {
        chunks.set(pathToChunk, dynamicImportsChunkNames[chunk as string]);
      } else if (isFromRoot) {
        chunks.set(pathToChunkWithRoot, dynamicImportsChunkNames[chunk as string]);
      }
    }
  });

  dynamicImports.clear();

  const children: any = [];

  // Traverse children of current path, dynamic imports are not children
  for (const staticImport of staticImports) {
    let staticImportPath = staticImport;
    for (const extension of extensions) {
      if (!staticImportPath.endsWith(extension)) {
        staticImportPath += extension;
      }

      const pathToStaticImport = resolve(cwd, staticImportPath);
      if (!existsSync(pathToStaticImport)) {
        staticImportPath = staticImport;
        continue;
      }

      children.push(getAllChunks(pathToStaticImport, root));
    }
  }

  return new Promise((resolve) => {
    Promise.all(children).then((childChunks) => {
      const allChunks: any = childChunks.reduce(
        (all: any, curr: any) => {
          return [...all, ...curr.chunks];
        },
        [...chunks]
      );
      store[path] = {
        path,
        chunks: new Map(allChunks),
        children: childChunks,
      };

      resolve(store[path]);
    });
  });
};
