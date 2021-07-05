import { useEffect, useState, useRef } from 'react';

export const useFetch = (url) => {
  const isCurrent = useRef(true);
  const [state, setState] = useState({ data: null, loading: true });

  useEffect(() => {
    setState((state) => ({ data: state.data, loading: true }));
    const fetchData = () => {
      fetch(url)
        .then((res) => res.json())
        .then((res) => {
          if (isCurrent.current) {
            setState({ data: res, loading: false });
          }
        })
        .catch((err) => console.log(err));
    };
    fetchData();
    return () => {
      // when component unmounts
      isCurrent.current = false;
    };
  }, [url]);

  return state;
};
