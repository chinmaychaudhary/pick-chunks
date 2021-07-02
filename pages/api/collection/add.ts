import type { NextApiResponse } from 'next';
import { addCollection } from '../../../utils/collections';

type Data = {
  status: string;
};

export default async function handler(req: any, res: NextApiResponse<Data>) {
  if (req.method === 'POST') {
    const collection = req.body;
    try {
      addCollection(req.configPath, collection);
      res.json({
        status: 'success',
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({
        status: err,
      });
    }
  }
}
