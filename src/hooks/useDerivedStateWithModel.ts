import {useCallback, useState} from "react";
import useModel from "./useModel";
import {GluerReturn} from "../../index";

const useDerivedStateWithModel = <S = any>( model: GluerReturn<S>, callback: (state: S) => S, deps: any[]): [S] => {
  const updateState = useCallback((s: S) => {
    if (typeof s === 'function') {
      model.silent(() => s);
    } else {
      model.silent(s);
    }
  }, [model]);

  let state = model();
  const [cachedDeps] = useState<{
    current: any[],
  }>(() => {
    state = callback(state);
    updateState(state);
    return {
      current: deps,
    };
  });

  if (deps.length !== cachedDeps.current.length) {
    cachedDeps.current = deps;
    state = callback(state);
    updateState(state);
  } else {
    for (let i = 0; i < deps.length; i += 1) {
      if (!Object.is(deps[i], cachedDeps.current[i])) {
        cachedDeps.current = deps;
        state = callback(state);
        updateState(state);
        break;
      }
    }
  }
  useModel(model);
  return [model()]
}

export default useDerivedStateWithModel;
