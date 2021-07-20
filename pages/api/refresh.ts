import type { NextApiResponse } from 'next';
import { clearStore } from '../../utils/getAllChunks';
import { clearChunksStore } from '../../utils/chunksCache';

type Data = {
  success: boolean;
};

export default async function handler(req: any, res: NextApiResponse<Data>) {
  try {
    clearStore();
    clearChunksStore();
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false });
  }
}
