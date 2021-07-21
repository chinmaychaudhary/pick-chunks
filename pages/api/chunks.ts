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

    if (store[body.path] !== undefined && store[body.path][body.getDescendant || false] !== undefined) {
      res.json(store[body.path][body.getDescendant || false]);
      return;
    }

    const tree = await getAllChunks(body.path, req.srcDir, body.getDescendant || false);
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

    if (!store[body.path]) {
      store[body.path] = {};
    }

    store[body.path][body.getDescendant || false] = JSON.parse(response);

    res.json(JSON.parse(response));
  }
}
