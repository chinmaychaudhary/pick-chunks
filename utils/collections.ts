import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from "@babel/generator";
import * as t from '@babel/types';
import { readFileSync, writeFileSync } from 'fs';

const createCollection = (collection: { name: string; description: string; chunks: string[] }) => {
  const { name, description, chunks } = collection;
  const nameProperty = t.objectProperty(t.identifier('name'), t.stringLiteral(name));
  const descriptionProperty = t.objectProperty(t.identifier('description'), t.stringLiteral(description));
  const chunksProperty = t.objectProperty(
    t.identifier('chunks'),
    t.arrayExpression(
      chunks.map((chunk) => {
        return t.stringLiteral(chunk);
      })
    )
  );
  return t.objectExpression([nameProperty, descriptionProperty, chunksProperty]);
};

const addCollection = (configPath: string, collection: { name: string; description: string; chunks: string[] }) => {
  const sourceCode = readFileSync(configPath).toString();
  const ast = parser.parse(sourceCode, {
    sourceType: 'module',
  });
  const collectionNode = createCollection(collection);

  traverse(ast, {
    AssignmentExpression(path) {
      const node = path.node;
      const isLeftModuleExports: boolean =
        t.isMemberExpression(node.left) &&
        (node.left as any)?.object?.name === 'module' &&
        (node.left as any)?.property?.name === 'exports';
      const isRightObjectExpression: boolean = t.isObjectExpression(node.right);

      if (!(isLeftModuleExports && isRightObjectExpression)) {
        return;
      }

      const collectionProperty: any[] = (node.right as t.ObjectExpression).properties.filter((property: any) => {
        return property.key.name === 'collections';
      });

      if (collectionProperty.length === 1) {
        if (!t.isArrayExpression(collectionProperty[0].value)) {
          throw Error('Collections value should be array');
        }
        collectionProperty[0].value.elements.push(collectionNode);
      } else {
        (node.right as t.ObjectExpression).properties.push(
          t.objectProperty(t.identifier('collections'), t.arrayExpression([collectionNode]))
        );
      }
    },
  });

  const transformedCode = generate(ast, {}, sourceCode).code;
  writeFileSync(configPath, transformedCode);
};

export { addCollection };
