import {useEffect, useState} from 'react';
import {GluerReturn, ModelStatus, Service} from "../../index";
import subscribe from "../subscribe";
import useCloneModel from "./internalHooks/useCloneModel";
import useService from "./internalHooks/useService";


/**
 * 将外部model注入到组件内部的自定义钩子函数，model生命周期不跟随组件，是共享数据
 * 区别于useIndividualModel
 * @param model 数据节点函数
 * @param deps 更新model的服务(可选) 每次deps中的service变更就会去获取更新一次model
 */
const useModel = <T = any>(model: GluerReturn<T>, deps?: [Service<T>]): [T, GluerReturn<T>, ModelStatus] => {
  const [clonedModel, status] = useCloneModel(model);
  useService(clonedModel, deps);
  const [state, updateState] = useState(() => {
    return model();
  });

  const [unsub] = useState(() => {
    return subscribe([model], (modelData: T) => {
      updateState(modelData);
    })
  });

  useEffect(() => unsub, []);

  return [state, clonedModel, status];
};

export default useModel;
