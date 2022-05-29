import { useState} from 'react';
import gluer, {defaultReducer} from '../gluer';
import {GluerReturn, ServiceStatus, Service, ServiceOptions} from '../../index';
import useModel from './useModel';

/**
 * model的生命周期跟随组件，相当于一个内部state
 * 区别于useModel
 * 不要尝试去订阅返回的clonedModel，不会有效果，因为它只是对真正的model的一层包装。需要监听的话，应该是内部真正的model。
 * @param initState
 * @param service (可选) 更新model的服务
 * @param deps (可选) 每次deps中的元素变更就会去获取更新一次model
 * @param options suspenseKey: string（是否开启Suspense模式）; onChange: (nextState, prevState) => void;
 */
const useIndividualModel = <S>(initState: S | (() => S), service?: Service<S>, deps?: any[], options?: ServiceOptions<S>): [S, GluerReturn<S>, GluerReturn<S>, ServiceStatus<S>] => {
  const [model] = useState(() => {
    if (typeof initState === 'function') {
      return gluer(defaultReducer ,(initState as () => S)());
    }
    return gluer(initState);
  });

  const [state, clonedModel, status] = useModel(model, service, deps, options);
  return [state, model, clonedModel, status];
}

export default useIndividualModel;
