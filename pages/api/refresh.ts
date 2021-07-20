import type { NextApiResponse } from 'next';
import { clearStore } from '../../utils/getAllChunks';

type Data = {
  success: boolean;
};

export default async function handler(req: any, res: NextApiResponse<Data>) {
  try {
    clearStore();
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
}
