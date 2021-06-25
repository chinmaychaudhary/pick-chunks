import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllFiles } from '../../utils/getAllFiles';

type Data = {
  directory: string;
  pages: any;
};


export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const query: any = req.query.q || '';
  const root = await fetch('http://localhost:3000/args/root').then((res) => res.text());
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
