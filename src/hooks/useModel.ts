import {useEffect, useState} from 'react';
import {GluerReturn, ModelStatus, Service, ServiceOptions} from "../../index";
import subscribe from "../subscribe";
import useCloneModel from "./internalHooks/useCloneModel";
import useService from "./internalHooks/useService";
import {defaultServiceOptions} from "../constants";


/**
 * 将外部model注入到组件内部的自定义钩子函数，model生命周期不跟随组件，是共享数据
 * 区别于useIndividualModel
 * @param model 数据节点函数
 * @param deps 更新model的服务(可选) 每次deps中的service变更就会去获取更新一次model
 * @param options 是否开启Suspense模式
 */
const useModel = <T = any>(model: GluerReturn<T>, deps?: [Service<T>], options?: ServiceOptions): [T, GluerReturn<T>, ModelStatus] => {
  const finalOptions = {
    ...defaultServiceOptions,
    ...options,
  };
  const [modelDeps] = useState(() => [model]);
  const [clonedModel, status] = useCloneModel(model, [modelDeps]);
  useService(clonedModel, deps, finalOptions);
  const [, updateState] = useState(() => {
    return model();
  });

  const [unsub] = useState(() => {
    return subscribe(modelDeps, (modelData: T) => {
      if (typeof modelData === 'function') {
        updateState(() => modelData);
      } else {
        updateState(modelData);
      }
    })
  });

  useEffect(() => unsub, []);

  return [model(), clonedModel, status];
};

export default useModel;
