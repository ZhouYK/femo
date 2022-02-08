import {useEffect, useRef, useState} from 'react';
import {GluerReturn, ModelStatus, ServiceControl, ServiceOptions} from '../../../index';
import {defaultReducer} from '../../gluer';
import {isAsync, isModel} from '../../tools';
import {promiseDeprecatedError} from '../../genRaceQueue';
import runtimeVar from '../../runtimeVar';
import {promiseDeprecated, promiseDeprecatedFromClonedModel} from '../../constants';

const runtimeVarAssignment = (callback: () => Promise<any>) => {
  runtimeVar.runtimePromiseDeprecatedFlag = promiseDeprecatedFromClonedModel;
  const result = callback();
  runtimeVar.runtimePromiseDeprecatedFlag = promiseDeprecated;
  return result;
}
/**
 *
 * @param model
 * @param modelDeps 用于减少一次组件rerender，因为异步获取状态变更时会去更新loading，所以当loading变更时静默掉订阅的回调。clonedModel中所有异步更新都应该加上这个
 */
const useCloneModel = <T>(model: GluerReturn<T>, modelDeps: GluerReturn<any>[][] = [], options?: ServiceOptions<T>): [GluerReturn<T>, ModelStatus] => {
  const { control } = options || {};
  const unmountedFlagRef = useRef(false);
  const cacheControlRef = useRef<GluerReturn<ServiceControl>>();
  const cacheControlOnChangeUnsub = useRef<() => void>();
  const underControl = useRef(false);

  const [status, updateStatus] = useState<ModelStatus>(() => {
    if (isModel(control)) {
      underControl.current = true;
      const r = (control as GluerReturn<ServiceControl>)();
      if (r.successful) {
        model.silent(r.data);
      }
      return {
        loading: r.loading,
        successful: r.successful,
      }
    }
    return {
      loading: false,
      successful: false,
    }
  });

  if (cacheControlRef.current !== control && isModel(control) && underControl.current) {
    cacheControlRef.current = control;
    if (cacheControlOnChangeUnsub.current) {
      cacheControlOnChangeUnsub.current();
    }
    cacheControlOnChangeUnsub.current = (control as GluerReturn<ServiceControl>).onChange((state) => {
      if (state.successful) {
        model.silent(state.data);
      }
      updateStatus({
        loading: state.loading,
        successful: state.successful,
      });
    });
  }


  // @ts-ignore
  const [clonedModel] = useState<GluerReturn<T>>(() => {

    const statusHandleFn = (p: Promise<any>) => {
      // 一旦调用statusHandleFn，表示已经不受外部控制状态了
      underControl.current = false;
      cacheControlRef.current = undefined;
      // 如果此时有监听，则需要解绑
      if (cacheControlOnChangeUnsub.current) {
        cacheControlOnChangeUnsub.current();
        cacheControlOnChangeUnsub.current = undefined;
      }

      updateStatus((prevState) => {
        return {
          ...prevState,
          loading: true,
          successful: false,
        }
      });
      p.then(() => {
        if (unmountedFlagRef.current) return;
        updateStatus((prevState) => {
          return {
            ...prevState,
            successful: true,
            loading: false,
          }
        });
      }).catch((err) => {
        if (unmountedFlagRef.current) return;
        // 如果不是异步竞争引起的异常或者不是clonedModel引起的异步竞争，则需要设置loading状态
        if (err !== promiseDeprecatedError || (err === promiseDeprecatedError && promiseDeprecated in p)) {
          updateStatus((prevState) => {
            return {
              ...prevState,
              loading: false,
              successful: false,
            }
          });
        }
      });
      return p;
    };

    // ModelMethod<T>
    const fn = (...args: any[]) => {
      // @ts-ignore
      const res = model.preTreat(...args);
      if (args.length === 0) return res;
      // 只有异步数据才会传入modelDeps
      if (isAsync(res)) {
        // 目前最多三个参数
        // 如果第三个参数手动传了，以手动为准
        // 没传，以传入的modelDeps为准
        return statusHandleFn(model(res, defaultReducer, args[2] || modelDeps) as Promise<T>);
      }
      return model(res);
    };

    Object.keys(model).forEach((key) => {
      // 需要对异步数据做单独处理，因为要加上异步状态的追踪
      if (key === 'race') {
        // @ts-ignore
        fn.race = (...args: any[]) => {
          // @ts-ignore
          const r = model.preTreat(...args);
          return runtimeVarAssignment(() => statusHandleFn(model.race(r, defaultReducer, args[2] || modelDeps)));
        };
      } else if (key === 'cache') {
        // 理由同 race
        // @ts-ignore
        fn.cache = (...args: any[]) => {
          if (args.length === 0) return model.cache();
          // @ts-ignore
          const r = model.preTreat(...args);
          return runtimeVarAssignment(() => statusHandleFn(model.cache(r, defaultReducer, args[2] || modelDeps)));
        };
      } else {
        // @ts-ignore
        fn[key] = (...args: any[]) => model[key](...args);
      }
    });
    return fn;
  });

  useEffect(() => () => {
    unmountedFlagRef.current = true;
  }, []);

  return [clonedModel, status];
}

export default useCloneModel;
