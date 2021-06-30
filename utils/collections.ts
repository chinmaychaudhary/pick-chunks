import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { existsSync, readFileSync } from 'fs';

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

  const isCollectionAdded: boolean = false;
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

      const collectionProperty: any = (node.right as t.ObjectExpression).properties.filter((property: any) => {
        return property.key.name === 'collections';
      });

      if (collectionProperty.length === 1) {
        collectionProperty.value.elements.append(collectionNode);
      } else {
        // TODO: create collection property and append collection
      }
    },
  });
};

export { createCollection };
