import type { NextApiRequest, NextApiResponse } from 'next';
import { resolve } from 'path';
import { getAllFiles } from '@rishabh3112/pc';

type Data = {
  directory: string;
  pages: any;
};

// TODO: find a way to get commandline args into nextjs application
const root = resolve(process.cwd(), './');

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const query = req.query.q || '';
  const files = await getAllFiles(root, query);
  const filesPerPage = 10;
  const pages: any = {};

  files.forEach((file: string, index: number) => {
    const page: string = Math.floor(index / filesPerPage).toString();
    if (pages[page] === undefined) {
      pages[page] = [];
    }
    pages[page].push(file);
  });

  res.status(200).json({
    directory: root,
    pages,
  });
}
