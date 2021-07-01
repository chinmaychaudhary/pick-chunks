import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllChunks, clearStore } from '../../utils/getAllChunks';

type Data = {
  directory: string;
  pages: any;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method === 'POST') {
    const body = req.body;
    const tree = await getAllChunks(body.path).then((tree: Record<string, any>) => {
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
        if (typeof value === 'object' && value instanceof Set) {
          return [...value];
        }
        return value;
      }
    );
    res.json(JSON.parse(response));
  }
}
