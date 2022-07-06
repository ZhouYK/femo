import { BindType, Callback, GluerReturn, HandleFunc, RacePromise } from '../index';
import { gluerUniqueFlagKey, gluerUniqueFlagValue, promiseDeprecated, underModelCallbackContext, } from './constants';
import genRaceQueue, { ErrorFlag, errorFlags, promiseDeprecatedError } from './genRaceQueue';
import runtimeVar, { RuntimeUpdateOrigin } from './runtimeVar';
import subscribe from './subscribe';
import { isArray, isAsync, isTagged, tagPromise } from './tools';
import { callbackToModelsMap, modelToCallbacksMap, modelToRacePromisesMap } from './unsubscribe';

export const defaultReducer = (data: any, _state: any) => data;
const warning = '你只传入了一个函数参数给gluer，这会被认为是reducer函数而不是初始值。如果你想存储一个函数类型的初始值，请传入两个参数：reducer和初始值。' +
  'reducer可以是最简单：(data, state) => data。这个的意思是：传入的数据会直接用来更新state。';
const getWarning = (rd: HandleFunc<any, any, any>) => `${warning}${rd.toString()}`;

const errorFlagsLength = errorFlags.length;
const raceHandle = (promise: RacePromise, callback: () => void, deprecatedFlag?: ErrorFlag) => {
  const errorFlag = deprecatedFlag || promiseDeprecated;

  for (let i = 0; i < errorFlagsLength; i += 1) {
    if (errorFlags[i] in promise) {
      callback();
      throw promiseDeprecatedError;
    }
  }
  promise[errorFlag] = true;
}

// 使 race promise 失效
const makeRacePromiseDeprecated = (promise: RacePromise) => {
  for (let i = 0; i < errorFlagsLength; i += 1) {
    if (errorFlags[i] in promise) {
      break;
    }
    promise[promiseDeprecated] = true;
  }
}
// 从统计中删除 race promise
const deleteRacePromise = (promise: RacePromise) => {
  modelToRacePromisesMap.forEach((value) => {
    if (value.has(promise)) {
      value.delete(promise);
    }
  })
}

const isUnderModelCallbackContext = () => {
  return runtimeVar.runtimeRacePromiseContext === underModelCallbackContext;
};

//
// const isUpdateFromUseModel = (updateType: number | undefined) => {
//   // 1 就代表更新来自 useModel
//   // 其他来自 model
//   return updateType === 1;
// }
//
// const isBoundByModel = (bindType: BindType | undefined) => {
//   return bindType === 0;
// };

const isBoundByUseModel = (bindType: BindType | undefined) => {
  return bindType === 1;
}

const isOnUpdateListenTypeCallback = (callback: Callback) => {
  return callback.__listen_type === 1;
}

interface Reducer {
  (data: any, state: any): any;
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

  const rq = genRaceQueue();

  let fn: any;

  // mutedCallback：不执的回调
  const updateFn = (data: any, silent: boolean, mutedCallback: Callback) => {
    if (!silent) {
      runtimeVar.runtimeRacePromiseContext = underModelCallbackContext;
      // 需要根据更新类型来判断，是否执行相应的 callback
      let updateType: any;
      let callbackIds: any;
      if (runtimeVar.runtimeUpdateOrigin) {
        updateType = runtimeVar.runtimeUpdateOrigin.updateType;
        callbackIds = runtimeVar.runtimeUpdateOrigin.callbackIds;
        // 在当前 model 的回调里将 callbackIds 置为空数组。这样就能保证，只有第一层 model 才能拿得到 callbackIds
        // 再往后的嵌套更新的 model 拿不到 callbackIds，因为这 callbackIds 本来就不是后面嵌套的 model 绑定的
        // 后面嵌套的 model 如果走了 useModel 的更新，则能拿到自己的; 如果没有走，则 callbackIds 会一直为空
        runtimeVar.runtimeUpdateOrigin = {
          updateType,
          callbackIds: [],
        };
      }

      const isInvalidCallback = (caba: Callback) => {

        const isBoundByUM = isBoundByUseModel(caba.__bind_type);
        // 不管变更来自哪里，useModel 或者 model 本身，不是被 useModel 绑定的 callback 都会执行
        // 那么不能执行的只看被 useModel 绑定的
        return isBoundByUM && (!callbackIds?.length || callbackIds.indexOf(caba.__id as number) === -1);
      }

      const onUpdateListenTypeCallback: Callback[] = [];
      const cbs = modelToCallbacksMap.get(fn) as Set<Callback>;
      if (!(Object.is(data, gluerState))) {
        gluerState = data;
        cbs?.forEach((callback) => {
          if (callback !== mutedCallback) {
            if (callbackToModelsMap.has(callback)) {
              if (isOnUpdateListenTypeCallback(callback)) {
                onUpdateListenTypeCallback.push(callback);
                return;
              }
              if (isInvalidCallback(callback)) return;

              const mods = callbackToModelsMap.get(callback) as Set<GluerReturn<any>>;
              // mods里面不管有没有当前model都去执行callback
              // 这里可能出现callback对应的mods中没有当前model，什么情况下会出现这种情况？
              // 当同一个callback被绑定到不同的模型依赖数组上时，callback对应的模型依赖数组总以最后一个绑定的模型依赖数组为准。
              /**
               * const callback = (dataArr, state) => {};
               * model_a.watch([model_b, model_c], callback);
               * model_d.watch([model_e, model_f], callback);
               * 当model_e变化时，callback会执行，注入callback的dataArr会是[model_e, model_f];
               * 当model_b变化时，callback也会执行，但此时注入callback的dataArr会是[model_e, model_f]。
               */

              const values = Array.from(mods).reduce((pre, cur) => {
                return [...pre, cur()];
              }, [] as any);
              callback(...values);
            }
          }
        });
      }
      // 如果有值，则表示上面已经处理过了，直接执行就好
      if (onUpdateListenTypeCallback.length) {
        onUpdateListenTypeCallback.forEach((callback) => {
          callback(gluerState);
        })
      } else {
        // 如果没有，则要自己筛选
        cbs?.forEach((callback) => {
          if (callback !== mutedCallback) {
            if (isOnUpdateListenTypeCallback(callback)) {
              if (isInvalidCallback(callback)) return;
              callback(gluerState);
            }
          }
        })
      }
      runtimeVar.runtimeRacePromiseContext = '';
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
    const [, ,mutedCallback] = ags;
    // 如果是异步更新
    if (isAsync(tempResult)) {
      let forAsyncRuntimeDepsModelCollectedMap: Map<GluerReturn<any>, number>;
      let forAsyncRuntimeUpdateOrigin: RuntimeUpdateOrigin | null;
      let forAsyncRuntimeRacePromisesCollectedSet: Set<RacePromise> | null;
      if (!silent) {
        forAsyncRuntimeDepsModelCollectedMap = new Map(runtimeVar.runtimeDepsModelCollectedMap)
        forAsyncRuntimeUpdateOrigin = runtimeVar.runtimeUpdateOrigin ? { ...runtimeVar.runtimeUpdateOrigin as RuntimeUpdateOrigin } : null;
        forAsyncRuntimeRacePromisesCollectedSet = runtimeVar.runtimeRacePromisesCollectedSet ?? null;
      }
      if (process.env.NODE_ENV === 'development' && isTagged(tempResult)) {
        console.warn('传入的promise已经被model使用了，请勿重复传入相同的promise，这样可能导致异步竞争，从而取消promise！')
      }
      // promise失败的情况则不用关心 forAsyncRuntimeDepsModelCollectedMap
      // 需要在promise失效时清除 runtimeVar.runtimeDepsModelCollectedMap

      const depsClearCallback = () => {
        // @ts-ignore
        forAsyncRuntimeDepsModelCollectedMap = null;
      };
      const errorFlag = runtimeVar.runtimePromiseDeprecatedFlag;
      const promise: any = (tempResult as Promise<any>).catch(e => {
        // 有可能 promise 没有在 onChange 和 onUpdate 的回调中被失效，而是自己正常完结的
        deleteRacePromise(promise);
        raceHandle(promise, depsClearCallback, errorFlag);
        return Promise.reject(e);
      }).then((data) => {
        // 有可能 promise 没有在 onChange 和 onUpdate 的回调中被失效，而是自己正常完结的
        deleteRacePromise(promise);
        raceHandle(promise, depsClearCallback, errorFlag);
        if (!silent) {
          // 异步回调中延续依赖
          runtimeVar.runtimeDepsModelCollectedMap = forAsyncRuntimeDepsModelCollectedMap;
          runtimeVar.runtimeUpdateOrigin = forAsyncRuntimeUpdateOrigin;
          runtimeVar.runtimeRacePromisesCollectedSet = forAsyncRuntimeRacePromisesCollectedSet;
        }
        updateFn(data, silent, mutedCallback);
        if (!silent) {
          // 每次异步回调都相当于是一个开始，所以需要在异步回调执行完成时将依赖清空
          runtimeVar.runtimeDepsModelCollectedMap.clear();
          runtimeVar.runtimeUpdateOrigin = null;
          runtimeVar.runtimeRacePromisesCollectedSet = null;
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

    updateFn(tempResult, silent, mutedCallback);
    deleteSelf();
    // 返回函数处理结果
    return tempResult;
  }

  fn = basicLogic(false);

  fn.reset = () => {
    fn(initState);
  }

  fn.watch = (models: GluerReturn<any>[], callback: (data: any[], state: typeof gluerState) => any) => {
    if (!isArray(models) || models.length === 0) {
      throw new Error('dependencies should be Array, ant not empty');
    }

    const subCallback = (...data: any[]) => {
      // 如果当前fn已经出现在调用链中，则不执行回调，因为回调中很可能有副作用
      if (runtimeVar.runtimeDepsModelCollectedMap.has(fn)) return;
      fn(callback(data, fn()));
    };
    return subscribe(models, subCallback, false);
  };

  fn.onChange = (callback: (state: typeof gluerState) => void) => {
    if (typeof callback !== 'function') {
      throw new Error('callback should be function');
    }

    return subscribe([fn], callback, false);
  }

  fn.onUpdate = (callback: (state: typeof gluerState) => void) => {
    if (typeof callback !== 'function') {
      throw new Error('callback should be function');
    }
    runtimeVar.runtimeListenType = 1;
    const unsub = subscribe([fn], callback, false);
    runtimeVar.runtimeListenType = 0;
    return unsub;
  }

  fn.silent = basicLogic(true);

  fn.race = (...as: any[]) => {
    let tmp: RacePromise = fn(...as);
    if (!isAsync(tmp)) {
      tmp = Promise.resolve(tmp);
    }

    if (!modelToRacePromisesMap.has(fn)) {
      // 需要在 fn 被解绑监听时删除掉，所有绑定都没有了才删
      modelToRacePromisesMap.set(fn, new Set());
    }
    const underModelCallbackContextRacePromises = modelToRacePromisesMap.get(fn) as Set<RacePromise>;

    if (!isUnderModelCallbackContext()) {
      // 不是在回调环境的，则将之前收集到的所有 race promise 置为失效
      // 每次异步调用 race ，都视为一次新开始（同循环依赖判断）
      // TODO 将来可能需要对异步里调用 race 的情况也做上下文判断(比如：是在 model change 对 race 做的异步调用，那么该异步调用也继承是在 model change 调用的这一标识，而现在是重新开始)
      underModelCallbackContextRacePromises.forEach((p) => {
        makeRacePromiseDeprecated(p);
      });
      underModelCallbackContextRacePromises.clear();
      runtimeVar.runtimeRacePromisesCollectedSet = underModelCallbackContextRacePromises;
      rq.push(tmp, runtimeVar.runtimePromiseDeprecatedFlag);
      runtimeVar.runtimeRacePromisesCollectedSet = null;
    } else {
      runtimeVar.runtimeRacePromisesCollectedSet?.add(tmp);
      rq.push(tmp, runtimeVar.runtimePromiseDeprecatedFlag);
    }
    return tmp;
  };

  fn.preTreat = (...as: any) => preTreat(...as);

  Object.defineProperty(fn, gluerUniqueFlagKey, {
    value: gluerUniqueFlagValue,
    writable: false,
    configurable: true,
    enumerable: true,
  });

  return fn;
}

export default gluer;
