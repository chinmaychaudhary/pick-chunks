import type { NextApiResponse } from 'next';
import { getAllChunks } from '../../utils/getAllChunks';
import { store } from '../../utils/chunksCache';

type Data = {
  directory: string;
  pages: any;
};

export default async function handler(req: any, res: NextApiResponse<Data>) {
  if (req.method === 'POST') {
    
    const body = req.body;
    if (store[body.path] !== undefined && store[body.path][body.getDescendant || false] !== undefined && store[body.path][body.getDescendant || false][body.skipImportWithoutChunkName || false] !== undefined) {
      res.json(store[body.path][body.getDescendant || false][body.skipImportWithoutChunkName || false]);
      return;
    }

    const tree = await getAllChunks(body.path, req.srcDir, body.getDescendant || false,body.skipImportWithoutChunkName);
    const response = JSON.stringify(
      {
        tree,
        chunks: tree.chunks,
      },
      (_, value) => {
        // Stringify ES6 Map
        if (typeof value === 'object' && value instanceof Map) {
          const obj = [];
          for (const [filepath, chunkName] of value) {
            obj.push({ filepath, chunkName });
          }
          return obj;
        }
        return value;
      }
    );

    //If the calculated path does not exist then initialize it with empty object
    if (!store[body.path]) {
        store[body.path] = {};
    }
    if (store[body.path][body.getDescendant || false] === undefined) {
        store[body.path][body.getDescendant || false] = {};
    }

    store[body.path][body.getDescendant || false][body.skipImportWithoutChunkName || false] = JSON.parse(response);
    res.json(JSON.parse(response));
  }
}
