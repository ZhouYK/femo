import {useCallback, useEffect, useRef, useState} from 'react';
import { FemoModel, Service, ServiceOptions, ServiceStatus, UnsubCallback } from '../../index';
import glue from '../core/glue';
import runtimeVar from '../core/runtimeVar';
import subscribe from '../core/subscribe';
import { isDevelopment, isModel } from '../tools';
import useCloneModel from './internalHooks/useCloneModel';
import useService from './internalHooks/useService';
import {defaultServiceOptions} from '../core/constants';

let idAtom = 0;

/**
 * 将外部model注入到组件内部的自定义钩子函数，model生命周期不跟随组件，是共享数据
 * @param model 数据节点函数
 * @param service (可选) 更新model的服务
 * @param deps (可选) 每次deps中的元素变更就会去获取更新一次model
 * @param options 详见 ServiceOptions 每次函数运行都是取的最新的options的值
 */
const useModel = <S = any, D = any>(initState: FemoModel<S> | S | (() => S), service?: Service<S, D> ,deps?: any[], options?: ServiceOptions<S>): [S, FemoModel<S>, ServiceStatus<S, D>] => {
  const finalOptions = {
    ...defaultServiceOptions,
    ...options,
  };
  let [model] = useState<FemoModel<S>>(() => {
    if (isModel(initState)) return initState as FemoModel<S>;
    if (typeof initState === 'function') {
      // @ts-ignore
      return glue(null, (initState as () => S)());
    }
    return glue(initState);
  });
  // 需要将外部传入的模型更新到model
  if (isModel(initState) && !Object.is(model, initState)) {
    model = initState as FemoModel<S>;
  }

  const [idState] = useState(() => {
    const b = idAtom;
    idAtom += 1
    return {
      id: b
    };
  });

  const optionsRef = useRef(finalOptions);
  optionsRef.current = finalOptions;

  const [, updateState] = useState<any>(null);
  const subscribeCallback = useCallback((_modelData: S) => {
    // 这里的回调并不会每次变更都执行，因为做了优化
    // 每次异步更新不同的数据成功时，都不会执行这里
    // 因为每次异步更新成功后，都有Loading状态更新来rerender组件
    // 不需要使用updateState来触发更新，所以在useCloneModel中做了静默处理
    // 所以options中的onChange不应该放在这里

    // 修复bug：不应该用modelData来触发组件更新，因为有可能走到这个回调里面的modelData前后两次一样，因为中间model.silent更新了数据。
    updateState({});
  }, []);

  const modelRef = useRef<typeof model>();
  const offChangeRef = useRef<UnsubCallback>();
  const offUpdateRef = useRef<UnsubCallback>();
  const unsubRef = useRef<UnsubCallback>();
  const callbackIdsRef = useRef<number[]>([]);

  const sta = model();
  const cachedOnChangeState = useRef(sta);
  const cachedOnUpdateState = useRef(sta);

  const onChangeCallback = useCallback((state: S) => {
    if (optionsRef.current.onChange) {
      const { current } = cachedOnChangeState;
      cachedOnChangeState.current = state;
      optionsRef.current.onChange(state, current);
    }
  }, []);

  const onUpdateCallback = useCallback((state: S) => {
    if (optionsRef.current.onUpdate) {
      const { current } = cachedOnUpdateState;
      cachedOnUpdateState.current = state;
      optionsRef.current.onUpdate(state, current);
    }
  }, []);

  const modelBind = () => {
    offChangeRef.current?.();
    offUpdateRef.current?.();
    unsubRef.current?.();
    // 每次解绑，都清空
    callbackIdsRef.current.splice(0);
    // 只针对 useModel 的 onChange 和 onUpdate
    runtimeVar.runtimeBindType = 1;
    offChangeRef.current = model.onChange(onChangeCallback);
    offUpdateRef.current = model.onUpdate(onUpdateCallback);
    // 每次绑定，都填满
    callbackIdsRef.current.push(offChangeRef.current?.__id as number, offUpdateRef.current?.__id as number);
    runtimeVar.runtimeBindType = 0;
    // subscribe 不包含进来
    unsubRef.current = subscribe([model], subscribeCallback, false, true);
    modelRef.current = model;
  }
  // model 引用变了，先解绑，再绑定
  // 需要在 useService 和 useCloneModel 之前用，因为可能会设置 model 的值
  if (!Object.is(modelRef.current, model)) {
    modelBind();
  }


  const [clonedModel, status] = useCloneModel(model, subscribeCallback, finalOptions);

  runtimeVar.runtimeUpdateOrigin = {
    updateType: 1,
    callbackIds: [...callbackIdsRef.current],
  };
  runtimeVar.runtimeUpdateOriginId = idState.id;
  const [localService] = useService(model, clonedModel, service, deps, finalOptions);
  runtimeVar.runtimeUpdateOrigin = null;
  runtimeVar.runtimeUpdateOriginId = null;

  useEffect(() => {
    if (isDevelopment()) {
      modelBind();
    }
  }, [model]);

  useEffect(() => {
    return () => { unsubRef.current?.(); offChangeRef.current?.(); offUpdateRef.current?.(); }
  }, []);

  return [model(), clonedModel, {
    ...status,
    service: localService,
  }];
};

export default useModel;
