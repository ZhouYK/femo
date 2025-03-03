import { useState} from 'react';
import glue, {defaultReducer} from '../core/glue';
import {FemoModel, ServiceStatus, Service, ServiceOptions} from '../../index';
import useModel from './useModel';

/**
 * @deprecated 请使用 useModel 代替
 *
 * 不要尝试去订阅返回的clonedModel，不会有效果，因为它只是对真正的model的一层包装。需要监听的话，应该是内部真正的model。
 * @param initState
 * @param service (可选) 更新model的服务
 * @param deps (可选) 每次deps中的元素变更就会去获取更新一次model
 * @param options suspenseKey: string（是否开启Suspense模式）; onChange: (nextState, prevState) => void;
 */
const useIndividualModel = <S = any, D = any>(initState: S | (() => S), service?: Service<S, D>, deps?: any[], options?: ServiceOptions<S>): [S, FemoModel<S>, ServiceStatus<S, D>] => {
  const [model] = useState(() => {
    if (typeof initState === 'function') {
      return glue(defaultReducer ,(initState as () => S)());
    }
    return glue(initState);
  });

  return useModel(model, service, deps, options);
}

export default useIndividualModel;
