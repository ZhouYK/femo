import {useEffect, useState} from 'react';
import {GluerReturn, ModelStatus} from "../../index";
import subscribe from "../subscribe";
import useCloneModel from "./internalHooks/useCloneModel";

/**
 * 将外部model注入到组件内部的自定义钩子函数，model生命周期不跟随组件，是共享数据
 * 区别于useIndividualModel
 * @param model 数据节点函数
 */
const useModel = <T = any>(model: GluerReturn<T>): [T, GluerReturn<T>, ModelStatus] => {
  // @ts-ignore
  const [clonedModel, status] = useCloneModel(model);

  const [state, updateState] = useState(() => {
    return model();
  });

  useEffect(() => {
    const unsub = subscribe([model], (modelData: any) => {
      updateState(modelData);
    });
    return () => {
      unsub();
    };
  }, []);


  return [state, clonedModel, status];
};

export default useModel;
