import {useCallback, useEffect, useRef, useState} from 'react';
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
 * @param options suspenseKey: string（是否开启Suspense模式）；cache: boolean（是否启用model的缓存）; onChange: (nextState, prevState) => void;
 */
const useModel = <T = any>(model: GluerReturn<T>, deps?: [Service<T>], options?: ServiceOptions<T>): [T, GluerReturn<T>, ModelStatus] => {
  const finalOptions = {
    ...defaultServiceOptions,
    ...options,
  };

  const optionsRef = useRef(finalOptions);
  optionsRef.current = finalOptions;

  const [modelDeps] = useState(() => [model]);
  const [clonedModel, status] = useCloneModel(model, [modelDeps]);
  useService(clonedModel, deps, finalOptions);
  const [cachedState] = useState(() => {
    return {
      data: model(),
    }
  });
  const [, updateState] = useState(() => {
    return model();
  });

  const onChangeCallback = useCallback((state: T) => {
    if (optionsRef.current.onChange) {
      const { data } = cachedState;
      cachedState.data = state;
      optionsRef.current.onChange(state, data);
    }
  }, []);

  const [offChange] = useState(() => {
    return model.onChange(onChangeCallback);
  });

  const [unsub] = useState(() => {
    return subscribe(modelDeps, (modelData: T) => {
      // 这里的回调并不会每次变更都执行，因为做了优化
      // 每次异步更新不同的数据成功时，都不会执行这里
      // 因为每次异步更新成功后，都有Loading状态更新来rerender组件
      // 不需要使用updateState来触发更新，所以在useCloneModel中做了静默处理
      // 所以options中的onChange不应该放在这里
      if (typeof modelData === 'function') {
        updateState(() => modelData);
      } else {
        updateState(modelData);
      }
    })
  });

  useEffect(() => () => { unsub(); offChange(); }, []);

  return [model(), clonedModel, status];
};

export default useModel;
