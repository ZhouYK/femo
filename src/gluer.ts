import { BindType, Callback, GluerReturn, HandleFunc, OnCallback, RacePromise, UnsubCallback } from '../index';
import {
  gluerUniqueFlagKey,
  gluerUniqueFlagValue,
  promiseDeprecated, underModelChangeContext,
  underOnUpdateContext,
} from './constants';
import genRaceQueue, { ErrorFlag, errorFlags, promiseDeprecatedError } from './genRaceQueue';
import runtimeVar from './runtimeVar';
import subscribe, { callbackCount } from './subscribe';
import { isArray, isAsync, isTagged, tagPromise } from './tools';
import { callbackToModelsMap, modelToCallbacksMap } from './unsubscribe';

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
const deleteRacePromise = (promise: RacePromise, onUpdateRacePromises: Set<RacePromise>, onChangeRacePromises: Set<RacePromise>) => {
  if (onUpdateRacePromises.has(promise)) {
    onUpdateRacePromises.delete(promise);
  }
  if (onChangeRacePromises.has(promise)) {
    onChangeRacePromises.delete(promise);
  }
}

const isUnderModelChangeContext = () => {
  return runtimeVar.runtimeRacePromiseContext === underModelChangeContext;
};

const isUnderOnUpdateContext = () => {
  return runtimeVar.runtimeRacePromiseContext === underOnUpdateContext;
}

const isUpdateFromUseModel = (updateType: number | undefined) => {
  // 1 就代表更新来自 useModel
  // 其他来自 model
  return updateType === 1;
}
//
// const isBoundByModel = (bindType: BindType | undefined) => {
//   return bindType === 0;
// };

const isBoundByUseModel = (bindType: BindType | undefined) => {
  return bindType === 1;
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
  const onUpdateCallbackArr: Map<number, OnCallback<typeof gluerState>> = new Map();
  const underOnUpdateContextRacePromises: Set<RacePromise> = new Set();
  const underModelChangeContextRacePromises: Set<RacePromise> = new Set();

  let fn: any;

  // mutedCallback：不执的回调
  const updateFn = (data: any, silent: boolean, mutedCallback: Callback) => {
    // 需要根据更新类型来判断，是否执行相应的 callback
    let updateType: any;
    let callbackIds: any;
    let useModelId;
    if (runtimeVar.runtimeUpdateOrigin) {
      updateType = runtimeVar.runtimeUpdateOrigin.updateType;
      callbackIds = runtimeVar.runtimeUpdateOrigin.callbackIds;
      useModelId = runtimeVar.runtimeUpdateOrigin.useModelId;
      // 在当前 model 的回调里将 callbackIds 置为空数组。这样就能保证，只有第一层 model 才能拿得到 callbackIds
      // 再往后的嵌套更新的 model 拿不到 callbackIds，因为这 callbackIds 本来就不是后面嵌套的 model 绑定的
      // 后面嵌套的 model 如果走了 useModel 的更新，则能拿到自己的; 如果没有走，则 callbackIds 会一直为空
      runtimeVar.runtimeUpdateOrigin = {
        updateType,
        callbackIds: [],
        useModelId,
      };
    }
    if (!silent) {
      let tmpRacePromises: RacePromise[] | null;
      const backEnd = () => {
        runtimeVar.runtimeRacePromiseContext = '';
        // 这里放到最后来做 race promise 的失效是因为，在回调 callback 中可能存在 race promise 被业务逻辑置为失效的情况。
        // 而这种情况是最优先的，因为涉及到 loading 的连续性
        tmpRacePromises?.forEach((p) => {
          makeRacePromiseDeprecated(p);
        });
        tmpRacePromises = null;
      }

      if (!(Object.is(data, gluerState))) {
        gluerState = data;
        const cbs = modelToCallbacksMap.get(fn) as Set<Callback>;
        if (cbs) {
          // 拷贝上次的结果
          tmpRacePromises = Array.from(underModelChangeContextRacePromises);
          // 将源数组清空，以便统计当次的 race promise
          underModelChangeContextRacePromises.clear();

          runtimeVar.runtimeRacePromiseContext = underModelChangeContext;
          cbs.forEach((callback) => {
            if (callback !== mutedCallback) {
              if (callbackToModelsMap.has(callback)) {

                // 更新来自 useModel service
                if (isUpdateFromUseModel(updateType)) {
                  // callbackIds 为空说明是嵌套在回调里的 model 直接更新引起的
                  // 不调用 通过 useModel 绑定的回调
                  // callbackIds 不为空，则不再其内的 callback 都不执行
                  if (
                    isBoundByUseModel(callback.__type)
                    && (!callbackIds?.length || callbackIds.indexOf(callback.__id as number) === -1)
                  ) {
                    return;
                  }
                  // 更新来自 model
                  // 如果回调是通过 useModel 绑定的（onChange、onUpdate），则不执行回调
                } else if (isBoundByUseModel(callback.__type)) return;

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

          backEnd();
        }
      } else {
        // 拷贝上次的结果
        tmpRacePromises = Array.from(underOnUpdateContextRacePromises);
        // 将源数组清空，以便统计当次的 race promise
        underOnUpdateContextRacePromises.clear();
        runtimeVar.runtimeRacePromiseContext = underOnUpdateContext;
        onUpdateCallbackArr.forEach((callback) => {
          callback(gluerState);
        });
        backEnd();
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
    const [, ,mutedCallback] = ags;
    // 如果是异步更新
    if (isAsync(tempResult)) {
      let forAsyncRuntimeDepsModelCollectedMap: Map<GluerReturn<any>, number>;
      if (!silent) {
        forAsyncRuntimeDepsModelCollectedMap = new Map(runtimeVar.runtimeDepsModelCollectedMap)
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
        deleteRacePromise(promise, underOnUpdateContextRacePromises, underModelChangeContextRacePromises);
        raceHandle(promise, depsClearCallback, errorFlag);
        return Promise.reject(e);
      }).then((data) => {
        // 有可能 promise 没有在 onChange 和 onUpdate 的回调中被失效，而是自己正常完结的
        deleteRacePromise(promise, underOnUpdateContextRacePromises, underModelChangeContextRacePromises);
        raceHandle(promise, depsClearCallback, errorFlag);
        if (!silent) {
          // 异步回调中延续依赖
          runtimeVar.runtimeDepsModelCollectedMap = forAsyncRuntimeDepsModelCollectedMap;
        }
        updateFn(data, silent, mutedCallback);
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
    const cb: OnCallback<typeof gluerState> = (state: typeof gluerState) => {
      return callback(state);
    };
    cb.__id = callbackCount.num;
    callbackCount.num += 1;
    cb.__type = runtimeVar.runtimeBindType;
    onUpdateCallbackArr.set(cb.__id, cb);
    const unsubUpdateCallback: UnsubCallback = () => {
      onUpdateCallbackArr.delete(cb.__id as number);
    };

    unsubUpdateCallback.__id = cb.__id;

    return unsubUpdateCallback;
  }

  fn.silent = basicLogic(true);

  fn.race = (...as: any[]) => {
    let tmp: RacePromise = fn(...as);
    if (!isAsync(tmp)) {
      tmp = Promise.resolve(tmp);
    } else if (isUnderModelChangeContext()) {
        underModelChangeContextRacePromises.add(tmp);
      } else if (isUnderOnUpdateContext()){
        underOnUpdateContextRacePromises.add(tmp);
      }
    const { useModelId, callbackIds, updateType } = runtimeVar.runtimeUpdateOrigin || {};
    tmp.__type = updateType;
    return rq.push(tmp, runtimeVar.runtimePromiseDeprecatedFlag)
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
