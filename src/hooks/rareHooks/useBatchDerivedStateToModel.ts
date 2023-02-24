import {useState} from 'react';
import {FemoModel} from '../../../index';
import useModel from '../useModel';

interface PreviousDerivedStatus<T = any> {
  source: T;
  prev: PreviousDerivedStatus;
  stateChanged?: boolean;
}
export interface DerivedSpace<S, T = any> {
  source: T;
  callback: (nextSource: T, prevSource: T, state: S, previousStatus: PreviousDerivedStatus) => S;
}

/**
 * 批量监听衍生数据生成的条件
 * @param model
 * @param derivedSpace
 */
const useBatchDerivedStateToModel = <S , D extends DerivedSpace<S>[]>(model: FemoModel<S>, ...derivedSpace: D): [S] => {
  let state = model();
  const [flag] = useState(() => {
    return {
      current: false
    }
  });
  const [cachedMap] = useState(() => {
    const map = new Map<number, PreviousDerivedStatus>();
    derivedSpace.forEach((ds, index) => {
      const prevDerivedSpacePositionState = map.get(index - 1) as PreviousDerivedStatus;
      const tmp = ds.callback(ds.source, ds.source, state, prevDerivedSpacePositionState);
      const derivedSpacePositionState: PreviousDerivedStatus = {
        source: ds.source,
        stateChanged: !Object.is(tmp, state),
        prev: prevDerivedSpacePositionState,
      };
      map.set(index, derivedSpacePositionState);
      state = tmp;
    });
    return {
      current: map,
    }
  });

  // 不是第一次了
  if (flag.current) {
    derivedSpace.forEach((ds, index) => {
      const derivedStatus = cachedMap.current.get(index);
      const { source, prev } = derivedStatus as PreviousDerivedStatus;
      const tmp = ds.callback(ds.source, source, state, prev);
      (derivedStatus as PreviousDerivedStatus).source = ds.source;
      (derivedStatus as PreviousDerivedStatus).stateChanged = !Object.is(tmp, state);
      state = tmp;
    });
  }
  if (!flag.current) {
    flag.current = true;
  }
  model.silent(state);
  useModel(model);
  return [model()];
}

export default useBatchDerivedStateToModel;
