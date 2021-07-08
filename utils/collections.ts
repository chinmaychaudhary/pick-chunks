import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { readFileSync, writeFileSync, existsSync } from 'fs';

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

const updateCollection = (configPath: string, collection: { name: string; description: string; chunks: string[] }) => {
  const sourceCode = readFileSync(configPath).toString();
  const ast = parser.parse(sourceCode, {
    sourceType: 'module',
  });

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

        const collections = collectionProperty[0].value.elements;
        collectionProperty[0].value.elements = collections.map((collectionNode: any) => {
          const nameOfCollectionNode = collectionNode.properties.reduce((value: any, prop: any) => {
            if (prop.key.name === 'name') {
              return prop.value.value;
            }
            return value;
          }, '');

          if (nameOfCollectionNode === collection.name) {
            return createCollection(collection);
          }
          return collectionNode;
        });
      }
    },
  });

  const transformedCode = generate(ast, {}, sourceCode).code;
  writeFileSync(configPath, transformedCode);
};

const addCollection = (configPath: string, collection: { name: string; description: string; chunks: string[] }) => {
  if (!existsSync(configPath)) {
    writeFileSync(configPath, `module.exports = {}`);
  }

  const currentCollections = getCollections(configPath);
  const currentCollectionNames = currentCollections.map((currCollection) => currCollection.name);
  if (currentCollectionNames.includes(collection.name)) {
    updateCollection(configPath, collection);
    return;
  }

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

const getCollections = (configPath: string) => {
  if (!existsSync(configPath)) {
    return [];
  }

  const sourceCode = readFileSync(configPath).toString();
  const ast = parser.parse(sourceCode, {
    sourceType: 'module',
  });
  let collections: any[] = [];

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
        collections = collectionProperty[0].value.elements.map((collectionNode: any) => {
          const collection: any = {};
          collectionNode.properties.forEach((collectionProperty: any) => {
            if (t.isStringLiteral(collectionProperty.value)) {
              collection[collectionProperty.key.name] = collectionProperty.value.value;
            } else if (t.isArrayExpression(collectionProperty.value)) {
              collection[collectionProperty.key.name] = collectionProperty.value.elements.map((element: any) => {
                return element.value;
              });
            }
          });
          return collection;
        });
      } else {
        collections = [];
      }
    },
  });

  return collections;
};

export { addCollection, getCollections };
