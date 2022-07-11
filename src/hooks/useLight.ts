import { useRef, useState } from 'react';

const useLight = (callback: () => void, deps: any[]) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const [cachedDeps] = useState<{
    current: any[],
  }>(() => {
    return {
      current: deps,
    };
  });
  if (deps.length !== cachedDeps.current.length) {
    cachedDeps.current = deps;
    callbackRef.current();
  } else {
    for (let i = 0; i < deps.length; i += 1) {
      if (!Object.is(deps[i], cachedDeps.current[i])) {
        cachedDeps.current = deps;
        callbackRef.current();
        break;
      }
    }
  }
}

export default useLight;
