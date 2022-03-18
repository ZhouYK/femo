import {
  // development,
  promiseDeprecated,
  gluerUniqueFlagKey,
  gluerUniqueFlagValue,
} from './constants';

import {HandleFunc, GluerReturn, Callback, RacePromise} from '../index';
import {isArray, isAsync, isTagged, tagPromise} from './tools';
import subscribe from './subscribe';
import unsubscribe, { refToDepsMap, depsToFnMap } from './unsubscribe';
import genRaceQueue, {ErrorFlag, promiseDeprecatedError} from './genRaceQueue';
import runtimeVar from './runtimeVar';

export const defaultReducer = (data: any, _state: any) => data;
const warning = '你只传入了一个函数参数给gluer，这会被认为是reducer函数而不是初始值。如果你想存储一个函数类型的初始值，请传入两个参数：reducer和初始值。' +
  'reducer可以是最简单：(data, state) => data。这个的意思是：传入的数据会直接用来更新state。';
const getWarning = (rd: HandleFunc<any, any, any>) => `${warning}${rd.toString()}`;
const raceHandle = (promise: RacePromise, callback: () => void, deprecatedFlag?: ErrorFlag) => {
  const errorFlag = deprecatedFlag || promiseDeprecated;

  if (errorFlag in promise) {
    callback();
    throw promiseDeprecatedError;
  }

  promise[errorFlag] = true;
}

const executeCallback = (targetDeps: GluerReturn<any>[]) => {
  const callback = depsToFnMap.get(targetDeps) as Set<Callback>;
  callback.forEach((call) => {
    const values: any[] = [];
    for (let k = 0; k < targetDeps.length; k += 1) {
      values.push(targetDeps[k]());
    }
    call(...values);
  })
}

/**
 * 节点生成函数
 * @returns {function(): {action: *, reducer: *, initState: *}}
 * @param fn
 */
function gluer<S, D = any, R = S>(fn: HandleFunc<S, D, R>) : GluerReturn<S>;
function gluer<S, D = any>(initialState: S) : GluerReturn<S>;
function gluer<S, D = any, R = S>(fn:  HandleFunc<S, D, R>, initialState: S) : GluerReturn<S>;
function gluer(...args: any[]) {
  const [rd, initialState] = args;
  let reducerFnc: Reducer;
  let initState = initialState;
  // 没有传入任何参数则默认生成一个reducer
  if (args.length === 0) {
    // 默认值reducer
    reducerFnc = defaultReducer;
  } else if (args.length === 1) {
    // 会被当做初始值处理
    if (typeof rd !== 'function') {
      // 默认生成一个reducer
      reducerFnc = defaultReducer;
      // 初始值
      initState = rd;
    } else {
      reducerFnc = rd;
      if (process.env.NODE_ENV === 'development') {
        console.warn(getWarning(rd));
      }
    }
  } else {
    if (typeof rd !== 'function') {
      throw new Error('first argument must be function');
    }
    reducerFnc = rd;
  }

  let gluerState = initState;

  const trackArr: any[] = [];
  let curIndex = 0;

  const rq = genRaceQueue();

  let unsubscribeRelyArr: (() => void)[] = [];

  let cachedData: any;
  let cachedFlag = false;
  let fromCache = false;

  let fn: any;
  let selfDeps: GluerReturn<any>[] = [];

  // mutedDeps：不执行其回调的依赖数组
  // curFromCache：是否来自cache方法的异步更新，默认 false（否）
  const updateFn = (data: any, silent: boolean, mutedDeps: GluerReturn<any>[][] = [], curFromCache = false) => {
    if (curFromCache && !cachedFlag) {
      cachedFlag = true;
      cachedData = data;
    }

    if (!(Object.is(data, gluerState))) {
      gluerState = data;
      if (!silent) {
        const { length } = trackArr;
        if (length) {
          if (curIndex < length - 1) {
            trackArr.splice(curIndex + 1);
          }
          trackArr.push(gluerState);
          curIndex += 1;
        }
        const targetDeps = refToDepsMap.get(fn) as Set<GluerReturn<any>[]>;
        if (targetDeps) {
          targetDeps.forEach((target) => {
            if (!mutedDeps.includes(target)) {
              executeCallback(target);
            }
          })
        }
      }
    }
  };

  const preTreat = (...ags: any[]) => {
    let payload;
    let customHandler;
    if (ags.length === 0) {
      // 直接返回
      return gluerState;
    } if (ags.length === 1) {
      // 只有一个传参
      if (typeof ags[0] === 'function') {
        [customHandler] = ags;
      } else {
        [payload] = ags;
      }
    } else {
      [payload, customHandler] = ags;
    }

    const realHandler = customHandler || reducerFnc;

    return realHandler(payload, gluerState);
  }
  const basicLogic = (silent = false) => (...ags: any[]) => {
    const tempResult = preTreat(...ags);
    if (ags.length === 0) return tempResult;
    if (!silent) {
      // 如果在model的调用链中出现过，则中断循环更新，不再执行
      if (runtimeVar.runtimeDepsModelCollectedMap.has(fn)) return tempResult;
      runtimeVar.runtimeDepsModelCollectedMap.set(fn, 0); // 追踪依赖
    }

    const deleteSelf = () => {
      if (!silent) {
        // 删掉自己
        runtimeVar.runtimeDepsModelCollectedMap.delete(fn);
      }
    };
    // 不执行回调的依赖数组
    // 第三个参数默认就是mutedDeps
    const [, ,mutedDeps] = ags;
    // 如果是异步更新
    if (isAsync(tempResult)) {
      let forAsyncRuntimeDepsModelCollectedMap: Map<GluerReturn<any>, number>;
      if (!silent) {
        forAsyncRuntimeDepsModelCollectedMap = new Map(runtimeVar.runtimeDepsModelCollectedMap)
      }
      if (process.env.NODE_ENV === 'development' && isTagged(tempResult)) {
        console.warn('传入的promise已经被model使用了，请勿重复传入相同的promise，这样可能导致异步竞争，从而取消promise！')
      }
      // 只有异步更新才有可能需要缓存
      const tmpFromCache = fromCache;
      // promise失败的情况则不用关心 forAsyncRuntimeDepsModelCollectedMap
      // 需要在promise失效时清除 runtimeVar.runtimeDepsModelCollectedMap

      const depsClearCallback = () => {
        // @ts-ignore
        forAsyncRuntimeDepsModelCollectedMap = null;
      };
      const promise: any = (tempResult as Promise<any>).catch(e => {
        raceHandle(promise, depsClearCallback);
        return Promise.reject(e);
      }).then((data) => {
        raceHandle(promise, depsClearCallback);
        if (!silent) {
          // 异步回调中延续依赖
          runtimeVar.runtimeDepsModelCollectedMap = forAsyncRuntimeDepsModelCollectedMap;
        }
        updateFn(data, silent, mutedDeps, tmpFromCache);
        if (!silent) {
          // 每次异步回调都相当于是一个开始，所以需要在异步回调执行完成时将依赖清空
          runtimeVar.runtimeDepsModelCollectedMap.clear();
        }
        return data;
      });
      if (process.env.NODE_ENV === 'development') {
        tagPromise(promise);
      }
      deleteSelf();
      // 返回函数处理结果
      return promise;
    }

    updateFn(tempResult, silent, mutedDeps);
    deleteSelf();
    // 返回函数处理结果
    return tempResult;
  }
  const historyGoUpdateFn = (step: number) => {
    const { length } = trackArr;
    if (length === 0) {
      return;
    }

    curIndex += step;
    if (curIndex < 0) {
      curIndex = 0;
    } else if (curIndex > length - 1) {
      curIndex = length - 1;
    }

    const data = trackArr[curIndex];
    if (!(Object.is(data, gluerState))) {
      gluerState = data;
      const targetDeps = refToDepsMap.get(fn) as Set<GluerReturn<any>[]>;
      if (targetDeps) {
        targetDeps.forEach((targetDep) => {
          executeCallback(targetDep);
        })
      }
    }
  }

  fn = basicLogic(false);

  fn.reset = () => {
    fn(initState);
  }

  fn.relyOn = (models: GluerReturn<any>[], callback: (data: any[], state: typeof gluerState) => any) => {
    if (!isArray(models) || models.length === 0) {
      throw new Error('dependencies should be Array, ant not empty');
    }

    const unsub = subscribe(models, (...data: any[]) => {
      // 如果当前fn已经出现在调用链中，则不执行回调，因为回调中很可能有副作用
      if (runtimeVar.runtimeDepsModelCollectedMap.has(fn)) return;
      fn(() => callback(data, fn()));
    }, false);
    unsubscribeRelyArr.push(unsub);
    return unsub;
  };

  const relyOffFn = (targetDeps?: GluerReturn<any>[]) => {
    // 没有传值，则认为是删除节点的全部依赖订阅
    if (targetDeps === undefined) {
      for (let i = 0; i < unsubscribeRelyArr.length; i += 1) {
        const f = unsubscribeRelyArr[i];
        f();
      }
      unsubscribeRelyArr = [];
    } else {
      unsubscribe(targetDeps);
    }
  };

  /**
   * 请使用relyOff
   * @deprecated
   */
  fn.off = relyOffFn
  // 替换off
  fn.relyOff = relyOffFn;

  fn.onChange = (callback: (state: typeof gluerState) => void) => {
    if (typeof callback !== 'function') {
      throw new Error('callback should be function');
    }
    return subscribe(selfDeps, callback, false);
  }

  fn.offChange = (callback?: (state: typeof gluerState) => void) => {
    unsubscribe(selfDeps, callback);
  }


  fn.silent = basicLogic(true);

  fn.track = () => {
    if (!trackArr.length) {
      trackArr.push(gluerState);
      curIndex = 0;
    }
  }

  fn.flush = () => {
    if (trackArr.length) {
      trackArr.splice(0);
      curIndex = 0;
    }
  }

  fn.go = (step: number) => {
    // 如果在model的调用链中出现过，则中断循环更新，不再执行
    if (runtimeVar.runtimeDepsModelCollectedMap.has(fn)) return gluerState;
    runtimeVar.runtimeDepsModelCollectedMap.set(fn, 0);
    historyGoUpdateFn(step);
    // 删掉自己
    runtimeVar.runtimeDepsModelCollectedMap.delete(fn);
    return gluerState;
  }

  fn.race = (...as: any[]) => rq.push(fn(...as), runtimeVar.runtimePromiseDeprecatedFlag);

  fn.preTreat = (...as: any) => preTreat(...as);

  // cache只针对异步更新
  fn.cache = (...as: any[]) => {
    if (as.length === 0) {
      return cachedData;
    }
    // 利用js是单线程执行，可设置运行时的状态变量，来给在运行时定义和调用的函数传参
    fromCache = true;
    let result;
    if (cachedFlag) {
      result = fn.race(() => Promise.resolve(cachedData));
    } else {
      result = fn.race(...as);
    }

    fromCache = false;
    return result;
  };

  fn.cacheClean = () => {
    cachedFlag = false;
    cachedData = undefined;
  };

  Object.defineProperty(fn, gluerUniqueFlagKey, {
    value: gluerUniqueFlagValue,
    writable: false,
    configurable: true,
    enumerable: true,
  });

  selfDeps = [fn];
  return fn;
}

export default gluer;
