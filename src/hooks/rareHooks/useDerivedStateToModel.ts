import {useState} from 'react';
import useModel from '../useModel';
import {FemoModel} from '../../../index';

/**
 * 背景知识：
 * react组件每一次由props引起的渲染，props对象都是新的（不论里面的属性是否有变更）
 * 每一次由内部state引起的渲染，props对象都没变
 * @param source
 * @param model 节点模型
 * @param callback 如果返回的是promise，则当次拿到的数据还会是老的，只有下一次渲染拿到的才会是最新的
 * @param perf 是否开启source的潜比较，优化性能
 */

const useDerivedStateToModel = <P, S>(source: P, model: FemoModel<S>, callback: (nextSource: P, prevSource: P, state: S) => S, perf = false): [S] => {

  let state = model();
  const [cachedProps] = useState<{
    current: P,
  }>(() => {
    if (perf) {
      state = callback(source, source, state);
    }
    return {
      current: source,
    };
  })

  if (perf) {
    if (!Object.is(cachedProps.current, source)) {
      state = callback(source, cachedProps.current, state);
    }
  } else {
    state = callback(source, cachedProps.current, state);
  }
  cachedProps.current = source;
  if (typeof state === 'function') {
    model.silent(() => state);
  } else {
    model.silent(state);
  }
  useModel(model);
  return [model()]
}

export default useDerivedStateToModel;
