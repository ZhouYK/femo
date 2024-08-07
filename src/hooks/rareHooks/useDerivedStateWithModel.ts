import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultReducer } from '../../core/glue';
import runtimeVar from '../../core/runtimeVar';
import subscribe from '../../core/subscribe';
import { Callback, FemoModel } from '../../../index';
import {isArray, isModel} from '../../tools';

const useDerivedStateWithModel = <S = any>( model: FemoModel<S>, callback: (state: S) => S, deps: any[], callWhenInitial = true, keepSilent = false): [S] => {
  const modelRef = useRef<FemoModel<S>>();

  const noticeChangeRef = useRef<S>(model());

  const unsubCallbackRef = useRef<() => void>();

  const keepSilentRef = useRef(keepSilent);
  keepSilentRef.current = keepSilent;

  const [, refresh] = useState({});
  const subscribeCallback = useCallback<Callback>((s) => {
    noticeChangeRef.current = s;

    // 与其他带有 model 监听的 hook 搭配使用时，那么自身则不刷新
    if (keepSilentRef.current) {
      return;
    }
    refresh({});
  }, []);

  // 如果需要监听 model 变化
  if (modelRef.current !== model) {
    unsubCallbackRef.current?.();
    unsubCallbackRef.current = subscribe([model], subscribeCallback, false, true);
  }
  modelRef.current = model;


  const updateState = useCallback((s: S, silent = true) => {
    // silent 是控制 deps 中 model 的变更刷新的
    // 只有 deps 中的 model 才会是 false，这时允许刷新组件
    if (!silent) {
      refresh({});
    }
    runtimeVar.runtimeFromDerived = true;
    noticeChangeRef.current = modelRef.current?.preTreat(s) as S;
    if (keepSilentRef.current) {
      runtimeVar.runtimeNoPreTreat = true;
      let result: any = noticeChangeRef.current;
      if (typeof result === 'function') {
        result = () => result;
      }
      modelRef.current?.silent(result);
      runtimeVar.runtimeFromDerived = false;
      return;
    }
    runtimeVar.runtimeFromDerived = false;
  }, []);

  const callWhenChange = (silent = true) => {
    updateState(callback((modelRef.current as FemoModel<S>)()), silent);
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

  // 通知其他监听了 model 的地方
  // 因为很可能有副作用，所以放 useEffect
  useEffect(() => {
    if (keepSilentRef.current) return;
    // noticeChangeRef.current 的变化来源
    // 1. 依赖变更
    // 2. 依赖里面有 dep model，依赖的 dep model 变更
    // 3. model 在其他地方被改变
    // 其中 1、2 这两种情况都会将最新的值赋值给 noticeChangeRef.current，而没有去更新 modelRef.current，因此需要手动调用一次 modelRef.current 去更新
    // 情况 3 是，其他地方更新了 modelRef.current 的值，通知到了这里。在 subscribeCallback 中去更新了 noticeChangeRef.current，组件刷新。
    // 此时 modelRef.current 内部的 state 和 noticeChangeRef.current 应该是一样的，不会引起 onChange
    let result: any = noticeChangeRef.current;
    if (typeof result === 'function') {
      result = () => result;
    }
    runtimeVar.runtimeFromDerived = true;
    (modelRef.current as FemoModel<S>).race(result, defaultReducer, subscribeCallback);
    runtimeVar.runtimeFromDerived = false;
  }, [noticeChangeRef.current]);

  return [keepSilentRef.current ? modelRef.current() : noticeChangeRef.current]
}

export default useDerivedStateWithModel;
