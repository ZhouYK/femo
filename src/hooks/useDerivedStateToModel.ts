import {useState} from "react";
import useModel from "./useModel";
import {GluerReturn} from "../../index";

/**
 * 背景知识：
 * react组件每一次由props引起的渲染，props对象都是新的（不论里面的属性是否有变更）
 * 每一次由内部state引起的渲染，props对象都没变
 * @param source
 * @param model 节点模型
 * @param callback 如果返回的是promise，则当次拿到的数据还会是老的，只有下一次渲染拿到的才会是最新的
 * @param perf 是否开启source的潜比较，优化性能
 */

const useDerivedStateToModel = <P = any, S = any>(source: P, model: GluerReturn<S>, callback: (nextSource: P, prevSource: P, state: S) => S, perf = false) => {

  const [flag] = useState(perf);

  const [cachedProps] = useState<{
    current: P,
  }>(() => {
    if (flag) {
      const data = callback(source, source, model());
      model.silent(data);
    }
    return {
      current: source,
    };
  })

  if (flag) {
    if (cachedProps.current !== source) {
      const data = callback(source, cachedProps.current, model());
      cachedProps.current = source;
      model.silent(data);
    }
  } else {
    const data = callback(source, cachedProps.current, model());
    if (cachedProps.current !== source) {
      cachedProps.current = source;
    }
    model.silent(data);
  }
  useModel(model);
  return [model()]
}

export default useDerivedStateToModel;
