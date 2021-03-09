import {useRef} from "react";
import useModel from "./useModel";
import {GluerReturn} from "../../index";

/**
 * 背景知识：
 * react组件每一次由props引起的渲染，props对象都是新的（不论里面的属性是否有变更）
 * 每一次由内部state引起的渲染，props对象都没变
 * @param props 组件属性
 * @param model 节点模型
 * @param callback 如果返回的是promise，则当次拿到的数据还会是老的，只有下一次渲染拿到的才会是最新的
 */

const useDerivedStateToModelFromProps = <P, S, R>(props: P, model: GluerReturn<S, R>, callback: (nextProps: P, prevProps: P, state: S) => S) => {
  const cachedProps = useRef<P>(props);
  const data = callback(props, cachedProps.current, model());
  if (cachedProps.current !== props) {
    cachedProps.current = props;
  }
  model.silent(data);
  useModel(model);
  return [model()]
}

export default useDerivedStateToModelFromProps;
