import { useEffect, useRef, useState } from 'react';
import {
  Callback,
  GluerReturn,
  LoadingStatus,
  RacePromise,
  ServiceControl,
  ServiceOptions, ServiceStatus,
} from '../../../index';
import {
  promiseDeprecated,
  promiseDeprecatedFromClonedModel, promiseDeprecatedFromLocalService,
  resolveCatchError,
} from '../../constants';
import { ErrorFlag, promiseDeprecatedError } from '../../genRaceQueue';
import { defaultReducer } from '../../gluer';
import runtimeVar from '../../runtimeVar';
import { isAsync, isModel } from '../../tools';
import useControl from './useControl';

/**
 * 需要区分promise竞争是由谁引起的，由origin model还是cloned model
 * 这里变的差异会导致loading状态的处理会有不同
 * origin model引发的，意味着 cloned model的更新被取代了，则应该设置loading为false
 * cloned model引发的，意味着 cloned model自己取代了自己，则loading状态可以保持延续，不用设置
  */

export const runtimePromiseDeprecatedVarAssignment = <P>(callback: () => Promise<P>, flag: ErrorFlag) => {
  runtimeVar.runtimePromiseDeprecatedFlag = flag;
  const result = callback();
  runtimeVar.runtimePromiseDeprecatedFlag = promiseDeprecated;
  return result;
}

export const isDeprecatedBySelf = (err: any, p: RacePromise, flags: ErrorFlag[]) => {
  const isDeprecatedError = err === promiseDeprecatedError;
  let deprecatedBySelf = false;
  const l = flags.length;
  for (let i = 0; i < l; i += 1) {
    deprecatedBySelf ||= (flags[i] in p);
  }
  return isDeprecatedError && deprecatedBySelf;
}
/**
 *
 * @param model
 * @param mutedCallback 用于减少一次组件rerender，因为异步获取状态变更时会去更新loading，所以当loading变更时静默掉订阅的回调。clonedModel中所有异步更新都应该加上这个
 * @param options
 */
const useCloneModel = <T = never>(model: GluerReturn<T>, mutedCallback: Callback, options?: ServiceOptions<T>): [GluerReturn<T>, Omit<ServiceStatus<T>, 'service'>] => {
  const { control } = options || {};
  const unmountedFlagRef = useRef(false);
  const cacheControlRef = useRef<GluerReturn<ServiceControl>>();
  const cacheControlOnChangeUnsub = useRef<() => void>();
  const cacheOutputControlChangeUnsub = useRef<() => void>();
  const cacheModelRef = useRef<GluerReturn<T>>();
  const underControl = useRef(false);


  const [status, updateStatus] = useState<LoadingStatus>(() => {
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

  const outputControl = useControl(model(), status);

  const syncUpdateStatus = (s: LoadingStatus) => {
    updateStatus((prevState) => {
      if (prevState.loading === s.loading && prevState.successful === s.successful) return prevState;
      outputControl((_d, state) => {
        return {
          ...state,
          ...s,
        }
      });
      return {
        ...prevState,
        ...s,
      }
    });
  }

  if (cacheControlRef.current !== control && isModel(control) && underControl.current) {
    cacheControlRef.current = control;
    if (cacheControlOnChangeUnsub.current) {
      cacheControlOnChangeUnsub.current();
    }
    cacheControlOnChangeUnsub.current = (control as GluerReturn<ServiceControl>).onChange((state) => {
      if (state.successful) {
        model.silent(state.data);
      }
      syncUpdateStatus({
        loading: state.loading,
        successful: state.successful,
      });
    });
  }

  const genClonedModel = () => {

    const statusHandleFn = <P>(p: Promise<P>, async: boolean) => {
      // 一旦调用statusHandleFn，表示已经不受外部控制状态了
      underControl.current = false;
      cacheControlRef.current = undefined;
      // 如果此时有监听，则需要解绑
      if (cacheControlOnChangeUnsub.current) {
        cacheControlOnChangeUnsub.current();
        cacheControlOnChangeUnsub.current = undefined;
      }
      // 如果传入的不是 异步数据，则直接返回
      if (!async) {
        syncUpdateStatus({
          loading: false, // loading 和 successful 更多的是表示 异步的状态
          successful: false, // 如果是同步数据，则将 successful 置为 false；successful 更多的应该表示异步更新才有有意义
        });
        return p;
      }
      syncUpdateStatus({
        loading: true,
        successful: false,
      })

      // catch 和 then 的先后顺序会影响执行顺序
      // 最优先处理错误
      p.catch((err) => {
        if (unmountedFlagRef.current) return resolveCatchError;
        // 如果不是异步竞争引起的异常或者不是clonedModel(包含了local service)引起的异步竞争，则需要设置loading状态
        // 这里关键是要确定 loading 和 promise 的对应关系，如果 promise 对应的是这里的 loading，则不用设置状态，因为已经上面👆🏻promise外设置了。
        // 详细信息请看上面的 runtimePromiseDeprecatedVarAssignment 注释
        if (err !== promiseDeprecatedError || !isDeprecatedBySelf(err, p, [promiseDeprecatedFromClonedModel, promiseDeprecatedFromLocalService])) {
          syncUpdateStatus({
            loading: false,
            successful: false,
          });
        }
        return resolveCatchError;
      }).then((info) => {
        if (unmountedFlagRef.current || info === resolveCatchError) return;
        syncUpdateStatus({
          successful: true,
          loading: false,
        });
      })
      return p;
    };

    // ModelMethod<T>
    // @ts-ignore
    const fn: GluerReturn<T> = (...args: never[]) => {
      // @ts-ignore
      const res = model.preTreat(...args);
      if (args.length === 0) return res;
      // 只有异步数据才会传入modelDeps
      if (isAsync(res)) {
        // 目前最多三个参数
        // 如果第三个参数手动传了，以手动为准
        // 没传，以传入的modelDeps为准
        return statusHandleFn(model(res, defaultReducer, args[2] || mutedCallback) as Promise<T>, true);
      }
      return model(res);
    };

    Object.setPrototypeOf(fn, model);
    fn.race = (...args: any[]) => {
      // @ts-ignore
      const r = model.preTreat(...args);
      return runtimePromiseDeprecatedVarAssignment(() => statusHandleFn(model.race(r, defaultReducer, args[2] || mutedCallback), isAsync(r)), promiseDeprecatedFromClonedModel);
    };

    // 用于外部包装，便于赋值 runtimePromiseDeprecatedVarAssignment
    // 目前在 useService 中有使用
    fn.__race__ = (...args: any[]) => {
      // @ts-ignore
      const r = model.preTreat(...args);
      return statusHandleFn(model.race(r, defaultReducer, args[2] || mutedCallback), isAsync(r));
    }
    return fn;
  };

  // @ts-ignore
  const [clonedModel] = useState<GluerReturn<T>>(() => {
    return genClonedModel();
  });

  const cacheClonedModelRef = useRef<GluerReturn<T>>(clonedModel);

  if (!Object.is(model, cacheModelRef.current)) {
    cacheOutputControlChangeUnsub.current?.();
    cacheOutputControlChangeUnsub.current = model.onChange((state) => {
      outputControl((_d, s) => {
        return {
          ...s,
          data: state,
        }
      })
    });
    cacheModelRef.current = model;
    cacheClonedModelRef.current = genClonedModel();
  }

  useEffect(() => () => {
    unmountedFlagRef.current = true;
    cacheControlOnChangeUnsub.current?.()
    cacheOutputControlChangeUnsub.current?.()
  }, []);

  return [cacheClonedModelRef.current, {
    ...status,
    control: outputControl,
  }];
}

export default useCloneModel;
