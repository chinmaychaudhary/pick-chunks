import { useQuery as baseUseQuery } from 'react-query';

function queryFn({ url, method, payload }: any) {
  return fetch(url, {
    method,
    //@ts-ignore
    body: payload ? JSON.stringify(payload) : null,
  }).then((r) => r.json());
}

const EMPTY_OBJ = {};

const useQuery = ({
  shouldFetch = true,
  url,
  method,
  payload,
  config = EMPTY_OBJ,
}: {
  shouldFetch: boolean;
  url: string;
  method: string;
  payload: any;
  config: {};
}) => baseUseQuery([url, method, payload], queryFn, config);

export { useQuery };
