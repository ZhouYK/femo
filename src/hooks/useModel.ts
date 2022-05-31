import {useCallback, useEffect, useRef, useState} from 'react';
import { GluerReturn, Service, ServiceOptions, ServiceStatus } from '../../index';
import subscribe from '../subscribe';
import useCloneModel from './internalHooks/useCloneModel';
import useService from './internalHooks/useService';
import {defaultServiceOptions} from '../constants';


/**
 * 将外部model注入到组件内部的自定义钩子函数，model生命周期不跟随组件，是共享数据
 * 区别于useIndividualModel
 * @param model 数据节点函数
 * @param service (可选) 更新model的服务
 * @param deps (可选) 每次deps中的元素变更就会去获取更新一次model
 * @param options {
 * suspenseKey: string（是否开启Suspense模式）；
 * onChange: (nextState, prevState) => void;
 * control: GluerReturn<ServiceControl>;
 * } 每次函数运行都是取的最新的options的值
 */
const useModel = <T = any, D = any>(model: GluerReturn<T>, service?: Service<T, D> ,deps?: any[], options?: ServiceOptions<T>): [T, GluerReturn<T>, ServiceStatus<T, D>] => {
  const finalOptions = {
    ...defaultServiceOptions,
    ...options,
  };

  const optionsRef = useRef(finalOptions);
  optionsRef.current = finalOptions;

  const [, updateState] = useState(0);
  const subscribeCallback = useCallback((_modelData: T) => {
    // 这里的回调并不会每次变更都执行，因为做了优化
    // 每次异步更新不同的数据成功时，都不会执行这里
    // 因为每次异步更新成功后，都有Loading状态更新来rerender组件
    // 不需要使用updateState来触发更新，所以在useCloneModel中做了静默处理
    // 所以options中的onChange不应该放在这里

    // 修复bug：不应该用modelData来触发组件更新，因为有可能走到这个回调里面的modelData前后两次一样，因为中间model.silent更新了数据。
    updateState((count) => count + 1);
  }, []);

  const [clonedModel, status] = useCloneModel(model, subscribeCallback, finalOptions);
  const [localService] = useService(model, clonedModel, service, deps, finalOptions);
  const [cachedState] = useState(() => {
    return {
      data: model(),
    }
  });

  const onChangeCallback = useCallback((state: T) => {
    if (optionsRef.current.onChange) {
      const { data } = cachedState;
      cachedState.data = state;
      optionsRef.current.onChange(state, data);
    }
  }, []);

  useEffect(() => {
    const offChange = model.onChange(onChangeCallback);
    const unsub = subscribe([model], subscribeCallback, false, true);
    return () => { unsub(); offChange(); }
  }, [model]);

  return [model(), clonedModel, {
    ...status,
    service: localService,
  }];
};

export default useModel;
