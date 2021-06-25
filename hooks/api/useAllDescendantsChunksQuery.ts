import { useCallback } from "react";
import { queryCache } from "react-query";

const useAllDescendantChunksQuery = () => {
	const loadAllDescendantChunks = useCallback((filepath) => {
		const cached = queryCache.getQueryData([
			`/api/all-descendant-chunks?fp=${filepath}`,
			"GET",
			null,
		]);
		return cached
			? Promise.resolve(cached)
			: fetch(`/api/all-descendant-chunks?fp=${filepath}`)
					.then((r) => r.json())
					.then((res) => {
						queryCache.setQueryData(
							[`/api/all-descendant-chunks?fp=${filepath}`, "GET", null],
							res
						);
						return res;
					});
	}, []);

	return loadAllDescendantChunks;
};

export { useAllDescendantChunksQuery };
