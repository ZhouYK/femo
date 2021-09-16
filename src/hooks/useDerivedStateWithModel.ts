import {useCallback, useEffect, useState} from "react";
import useModel from "./useModel";
import {GluerReturn} from "../../index";
import {isArray, isModel} from "../tools";

const useDerivedStateWithModel = <S = any>( model: GluerReturn<S>, callback: (state: S) => S, deps: any[]): [S] => {
  const updateState = useCallback((s: S, silent = true) => {
    let result: any = s;
    if (typeof s === 'function') {
      result = () => s
    }

    if (silent) {
      model.silent(result);
    } else {
      model(result);
    }
  }, []);

  const callWhenChange = useCallback((silent = true) => {
    updateState(callback(model()), silent);
  }, [callback]);

  const [map] = useState(() => new Map());

  const analyzeDeps = useCallback((ds: any[]) => {
    if (!isArray(ds)) return;
    for (let i = 0; i < ds.length; i += 1) {
      const d = ds[i];
      if (isModel(d)) {
        if (map.has(d)) {
          (d as GluerReturn<any>).offChange(map.get(d));
        }
        map.set(d, (d as GluerReturn<any>).onChange(() => {
          callWhenChange(false);
        }))
      }
    }
  }, [callWhenChange]);


  const [cachedDeps] = useState<{
    current: any[],
  }>(() => {
    callWhenChange();
    analyzeDeps(deps);
    return {
      current: deps,
    };
  });

  if (deps.length !== cachedDeps.current.length) {
    cachedDeps.current = deps;
    callWhenChange();
    analyzeDeps(deps);
  } else {
    for (let i = 0; i < deps.length; i += 1) {
      if (!Object.is(deps[i], cachedDeps.current[i])) {
        cachedDeps.current = deps;
        callWhenChange();
        analyzeDeps(deps);
        break;
      }
    }
  }
  useEffect(() => () => {
    const unsubscribes = Array.from(map.values());
    for (let i = 0; i < unsubscribes.length; i += 1) {
      unsubscribes[i]();
    }
    map.clear();
  }, []);
  useModel(model);
  return [model()]
}

export default useDerivedStateWithModel;
