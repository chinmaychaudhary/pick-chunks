import { useCallback } from 'react';
import { QueryClient } from 'react-query';

const queryClient = new QueryClient();

const useAllDescendantChunksQuery = () => {
  const loadAllDescendantChunks = useCallback((filepath) => {
    const cached = queryClient.getQueryData([`/api/all-descendant-chunks?fp=${filepath}`, 'GET', null]);
    return cached
      ? Promise.resolve(cached)
      : fetch(`/api/all-descendant-chunks?fp=${filepath}`)
          .then((r) => r.json())
          .then((res) => {
            queryClient.setQueryData([`/api/all-descendant-chunks?fp=${filepath}`, 'GET', null], res);
            return res;
          });
  }, []);

  return loadAllDescendantChunks;
};

export { useAllDescendantChunksQuery };
