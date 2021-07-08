import type { NextApiResponse } from 'next';
import { getAllFiles } from '../../utils/getAllFiles';

type Data = {
  directory: string;
  files: string[];
};

export default async function handler(req: any, res: NextApiResponse<Data>) {
  const query: any = req.query.q || '';
  const root = req.srcDir;
  const files = await getAllFiles(root, query);
  res.status(200).json({
    directory: root,
    files,
  });
}
