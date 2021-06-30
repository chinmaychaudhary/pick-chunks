import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { existsSync, readFileSync } from "fs";


const createCollection = (name: string, description: string, chunks: string[]) => {
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


export {
    createCollection
}
