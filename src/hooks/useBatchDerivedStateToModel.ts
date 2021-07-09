import {useState} from "react";
import {GluerReturn} from "../../index";
import useModel from "./useModel";

export interface DerivedSpace<S, T> {
  source: T;
  callback: (nextSource: T, prevSource: T, state: S) => S;
  perf?: boolean;
}

/**
 * 批量监听衍生数据生成的条件
 * @param model
 * @param derivedSpace
 */
const useBatchDerivedStateToModel = <S , D extends DerivedSpace<S, any>[]>(model: GluerReturn<S>, ...derivedSpace: D): [S] => {
  let state = model();
  const [flag] = useState(() => {
    return {
      current: false
    }
  });
  const [cachedMap] = useState(() => {
    const map = new Map<number, any>();
    derivedSpace.forEach((ds, index) => {
      map.set(index, ds.source);
      state = ds.callback(ds.source, ds.source, state);
    });
    return {
      current: map,
    }
  });

  // 不是第一次了
  if (flag.current) {
    derivedSpace.forEach((ds, index) => {
      const prevSource = cachedMap.current.get(index);
      if (ds.perf) {
        if (!Object.is(prevSource, ds.source)) {
          state = ds.callback(ds.source, prevSource, state);
        }
      } else {
        state = ds.callback(ds.source, prevSource, state);
      }
      cachedMap.current.set(index, ds.source);
    });
  }
  if (!flag.current) {
    flag.current = true;
  }
  if (typeof state === 'function') {
    model.silent(() => state);
  } else {
    model.silent(state);
  }
  useModel(model);
  return [model()];
}

export default useBatchDerivedStateToModel;
