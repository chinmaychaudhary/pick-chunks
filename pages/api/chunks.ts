import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllChunks, clearStore } from '../../utils/getAllChunks';

type Data = {
  directory: string;
  pages: any;
};

export default async function handler(req: any, res: NextApiResponse<Data>) {
  if (req.method === 'POST') {
    const body = req.body;
    const tree = await getAllChunks(body.path, req.srcDir).then((tree: Record<string, any>) => {
      clearStore();
      return tree;
    });
    const response = JSON.stringify(
      {
        tree,
        chunks: tree.chunks,
      },
      (_, value) => {
        // Stringify Set
        if (typeof value === 'object' && value instanceof Map) {
          console.log('Appls');
          const obj = [];
          for (const [filePath, name] of value) {
            obj.push({ filePath, name });
          }
          return obj;
        }
        return value;
      }
    );
    console.log(JSON.parse(response));
    res.json(JSON.parse(response));
  }
}
