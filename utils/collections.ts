import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { relative } from 'path';

/**
 * Creates AST subtree for a chunk collection
 * @param collection object representing chunk collection
 * @returns object expression node for chunk collection
 */
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

/**
 * Updates a particular chunk collection in configuration file
 * Assumes, name as key for updation.
 * @param configPath path to the configuration of the user
 * @param collection object with the new value for the given collection
 */
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

/**
 * Adds a new collection to the configuration file.
 * If collection with given name exists, it updates the collection in configuration itself.
 * @param configPath path to the configuration file
 * @param collection object representing a chunk collection
 */
const addCollection = (configPath: string, collection: { name: string; description: string; chunks: string[] }) => {
  if (!existsSync(configPath)) {
    writeFileSync(configPath, `module.exports = {}`);
  }

  const currentCollections = getCollections(configPath);
  const currentCollectionNames = currentCollections.map((currCollection) => currCollection.name);
  // Assuming name of the collection as unique identifier
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

/**
 * Lists all collections stored in configuration file
 * @param configPath path to the configuration file
 * @returns all chunk collections in the configuration file
 */
const getCollections = (configPath: string) => {
  if (!existsSync(configPath)) {
    return [];
  }

  const relativePath = relative(__dirname, configPath);
  const configuration = require(relativePath);
  return configuration.collections || [];
};

export { addCollection, getCollections };
