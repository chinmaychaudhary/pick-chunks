import type { NextApiResponse } from 'next';
import { getCollections } from '../../../utils/collections';

type Data = {
    name: string,
    description: string,
    chunks: string[]
}[]

export default async function handler(req: any, res: NextApiResponse<Data>) {
  const collections: any[] = getCollections(req.configPath);
  res.status(200).json((collections as Data));
}
