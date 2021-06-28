import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllFiles } from '../../utils/getAllFiles';

type Data = {
  directory: string;
  files: string[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const query: any = req.query.q || '';
  const root = await fetch('http://localhost:3000/args/root').then((res) => res.text());
  const files = await getAllFiles(root, query);

  res.status(200).json({
    directory: root,
    files,
  });
}
