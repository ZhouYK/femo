import { useCallback, useEffect, useRef, useState } from 'react';
import useModel from '../useModel';
import {FemoModel} from '../../../index';
import {isArray, isModel} from '../../tools';

const useDerivedStateWithModel = <S = any>( model: FemoModel<S>, callback: (state: S) => S, deps: any[], callWhenInitial = true): [S] => {
  const modelRef = useRef(model);
  modelRef.current = model;

  const updateState = useCallback((s: S, silent = true) => {
    let result: any = s;
    if (typeof s === 'function') {
      result = () => s
    }

    if (silent) {
      modelRef.current.silent(result);
    } else {
      modelRef.current(result);
    }
  }, []);

  const callWhenChange = (silent = true) => {
    updateState(callback(modelRef.current()), silent);
  };

  const [map] = useState(() => new Map());

  const analyzeDeps = (ds: any[]) => {
    if (!isArray(ds)) return;
    for (let i = 0; i < ds.length; i += 1) {
      const d = ds[i];
      if (isModel(d)) {
        if (map.has(d)) {
          // 解绑
          map.get(d)();
        }
        // 绑定
        map.set(d, (d as FemoModel<any>).onChange(() => {
          callWhenChange(false);
        }))
      }
    }
  };


  const [cachedDeps] = useState<{
    current: any[],
  }>(() => {
    if (callWhenInitial) {
      callWhenChange();
    }
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
