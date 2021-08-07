import { useRef, useCallback, useEffect } from 'react';
import { useLazyQuery } from '@apollo/client';

const useLazyQueryPromise = (query, options) => {
  const [execute, result] = useLazyQuery(query, options);

  const resolveRef = useRef();

  useEffect(() => {
    if (result.called && !result.loading && resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = undefined;
    }
  }, [result.loading, result.called, result]);

  const queryLazily = useCallback(
    (variables, context) => {
      execute({ variables, context });
      return new Promise((resolve) => {
        resolveRef.current = resolve;
      });
    },
    [execute]
  );

  return [queryLazily, result];
};

export default useLazyQueryPromise;
