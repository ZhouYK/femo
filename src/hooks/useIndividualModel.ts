import {useEffect, useState} from "react";
import gluer, {defaultReducer} from "../gluer";
import subscribe from "../subscribe";
import {GluerReturn, ModelStatus, Service, ServiceOptions} from "../../index";
import useCloneModel from "./internalHooks/useCloneModel";
import useService from "./internalHooks/useService";
import {defaultServiceOptions} from "../constants";

/**
 * model的生命周期跟随组件，相当于一个内部state
 * 区别于useModel
 * 不要尝试去订阅返回的clonedModel，不会有效果，因为它只是对真正的model的一层包装。需要监听的话，应该是内部真正的model。
 * @param initState
 * @param deps 更新model的服务(可选) 每次deps中的service变更就会去获取更新一次model
 * @param options 是否开启Suspense模式
 */
const useIndividualModel = <S>(initState: S | (() => S), deps?: [Service<S>], options?: ServiceOptions): [S, GluerReturn<S>, GluerReturn<S>, ModelStatus] => {
  const finalOptions = {
    ...defaultServiceOptions,
    ...options,
  };

  const [model] = useState(() => {
    if (typeof initState === 'function') {
      return gluer(defaultReducer ,(initState as () => S)());
    }
    return gluer(initState);
  });

  const [modelDeps] = useState(() => [model]);
  const [clonedModel, status] = useCloneModel(model, modelDeps);

  useService(clonedModel, deps, finalOptions);

  const [, updateState] = useState(() => {
    return model();
  });

  const [unsub] = useState(() => {
    return subscribe(modelDeps, (data) => {
      if (typeof data === 'function') {
        updateState(() => data);
      } else {
        updateState(data);
      }

    });
  });

  useEffect(() => unsub, []);

  return [model(), model, clonedModel, status];
}

export default useIndividualModel;
