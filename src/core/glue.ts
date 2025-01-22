import { BindType, Callback, FemoModel, HandleFunc, RacePromise } from '../../index';
import { composeReducer, isArray, isAsync, isDevelopment, isTagged, mergeCurToPre, tagPromise } from '../tools';
import {
  defaultGlueConfig, GlueConflictPolicy,
  gluerUniqueFlagKey,
  gluerUniqueFlagValue,
  promiseDeprecated,
  underModelCallbackContext,
} from './constants';
import genRaceQueue, { ErrorFlag, errorFlags, promiseDeprecatedError } from './genRaceQueue';
import runtimeVar, { RuntimeUpdateOrigin } from './runtimeVar';
import subscribe from './subscribe';
import { callbackToModelsMap, modelToCallbacksMap, modelToRacePromisesMap } from './unsubscribe';

export const defaultReducer = (_state: any, data: any) => data;
export const defaultReducerLast = (state: any, _data: any) => state;
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
// 如果 promise 有 originId，则代表是从 useModel 产生的，则需要 beginId 和 originId 相同才置为失效
// 如果 promise 没有 originId，则代表是普通的 model.race 产生的
// 如果 beginId 存在，则只找有 originId 的 promise 且 beginId === originId 相同的置为失效；
// 如果 beginId 不存在，则只找没有 originId 的 promise 置为失效
const makeRacePromiseDeprecated = (promise: RacePromise, beginId: number | null) => {
  for (let i = 0; i < errorFlagsLength; i += 1) {
    if (errorFlags[i] in promise) {
      return;
    }
  }
  // 如果 beginId 存在，则只找有 originId 的 promise 且 beginId === originId 相同的置为失效；
  if (typeof beginId === 'number') {
    if (beginId === promise.originId) {
      promise[promiseDeprecated] = true;
    }
    return;
  }
  // 如果 beginId 不存在，则只找没有 originId 的 promise 置为失效
  if (typeof promise.originId !== 'number') {
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
  (state: any, data: any): any;
}
/**
 * 节点生成函数
 * @returns {function(): {action: *, reducer: *, initState: *}}
 * @param fn
 */
function glue<S, D = any, R = S>(fn: HandleFunc<S, D, R>) : FemoModel<S>;
function glue<S, D = any>(initialState: S) : FemoModel<S>;
function glue<S, D = any, R = S>(fn:  HandleFunc<S, D, R>, initialState: S) : FemoModel<S>;
function glue(...args: any[]) {
  const [rd, initialState] = args;
  let reducerFnc: Reducer;
  let initState = initialState;
  // 没有传入任何参数则默认生成一个reducer
  if (args.length === 0) {
    // 默认值reducer
    reducerFnc = defaultReducerLast;
  } else if (args.length === 1) {
    // 会被当做初始值处理
    if (typeof rd !== 'function') {
      // 默认生成一个reducer
      reducerFnc = defaultReducerLast;
      // 初始值
      initState = rd;
    } else {
      reducerFnc = rd;
      if (isDevelopment()) {
        console.warn(getWarning(rd));
      }
    }
  } else if (typeof rd !== 'function') {
    // 放宽对 rd 的限制
    reducerFnc = defaultReducerLast;
  } else {
    reducerFnc = rd;
  }

  let glueState = initState;
  let glueConfig = defaultGlueConfig;


  let fn: any;

  const rq = genRaceQueue();

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
      if (!(Object.is(data, glueState))) {
        glueState = data;
        cbs?.forEach((callback) => {
          if (callback !== mutedCallback) {
            if (callbackToModelsMap.has(callback)) {
              if (isInvalidCallback(callback)) return;
              if (isOnUpdateListenTypeCallback(callback)) {
                onUpdateListenTypeCallback.push(callback);
                return;
              }

              const mods = callbackToModelsMap.get(callback) as Set<FemoModel<any>>;
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
          callback(glueState);
        })
      } else {
        // 如果没有，则要自己筛选
        cbs?.forEach((callback) => {
          if (callback !== mutedCallback) {
            if (isOnUpdateListenTypeCallback(callback)) {
              if (isInvalidCallback(callback)) return;
              callback(glueState);
            }
          }
        })
      }
      runtimeVar.runtimeRacePromiseContext = '';
    } else if (!(Object.is(data, glueState))) {
        glueState = data;
    }
  };

  const preTreat = (...ags: any[]) => {
    let payload;
    let customHandler;
    if (ags.length === 0) {
      // 直接返回
      return glueState;
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

    const tmpHandler = customHandler || defaultReducer;

    const realHandler = composeReducer(tmpHandler, reducerFnc);
    return realHandler(glueState, payload);
  }
  const basicLogic = (silent = false) => (...ags: any[]) => {
    // 获取不走预处理
    if (ags.length === 0) return glueState;

    let tempResult;
    if (runtimeVar.runtimeNoPreTreat) {
      // runtimeVar.runtimeNoPreTreat 为 true 时，传入的第一个参数就是结果
      [tempResult] = ags;
      runtimeVar.runtimeNoPreTreat = false;
    } else {
      tempResult = preTreat(...ags);
    }
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
    // 第三个参数默认就是 mutedCallback
    const [, ,mutedCallback] = ags;
    // 如果是异步更新
    if (isAsync(tempResult)) {
      let forAsyncRuntimeDepsModelCollectedMap: Map<FemoModel<any>, number>;
      let forAsyncRuntimeUpdateOrigin: RuntimeUpdateOrigin | null;
      let forAsyncRuntimeRacePromisesCollectedSet: Set<RacePromise> | null;
      let forAsyncRuntimeBeginOriginId: number | null;
      if (!silent) {
        forAsyncRuntimeDepsModelCollectedMap = new Map(runtimeVar.runtimeDepsModelCollectedMap)
        forAsyncRuntimeUpdateOrigin = runtimeVar.runtimeUpdateOrigin ? { ...runtimeVar.runtimeUpdateOrigin as RuntimeUpdateOrigin } : null;
        forAsyncRuntimeRacePromisesCollectedSet = runtimeVar.runtimeRacePromisesCollectedSet ?? null;
        forAsyncRuntimeBeginOriginId = runtimeVar.runtimeBeginOriginId;
      }
      if (isDevelopment() && isTagged(tempResult)) {
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
        deleteRacePromise(promise); // TODO 有问题

        // 如果冲突处理是 merge 策略，不用做竞态抛错处理，直接抛出原始错误信息
        if (glueConfig?.updatePolicy === GlueConflictPolicy.merge) {
          // merge 模式原位替换
          rq.replace(promise, null);
          return Promise.reject(e);
        }
        // 从原始数组删除 promise
        rq.replace(promise);
        raceHandle(promise, depsClearCallback, errorFlag);
        return Promise.reject(e);
      }).then(async (data) => {
        let tmpData = data;
        // 有可能 promise 没有在 onChange 和 onUpdate 的回调中被失效，而是自己正常完结的
        deleteRacePromise(promise);

        // 如果冲突处理是 merge 策略，不做竞态判断
        if (glueConfig?.updatePolicy === GlueConflictPolicy.merge) {
          const pIndex = rq.getIndex(promise);
          const arrBefore = rq.slice(0, pIndex < 0 ? 0 : pIndex);
          // merge 模式原位替换
          rq.replace(promise, tmpData);
          // 不处于数组的开始，则需要等待前面的数据 ready
          if (arrBefore?.length) {
            const dataArr = await Promise.allSettled(arrBefore);
            const values: any[] = [];
            // 失败的结果不参与更新
            dataArr?.forEach((d) => {
              if (d.status === 'fulfilled') {
                values.push(d?.value);
              }
            })
            tmpData = mergeCurToPre([glueState, ...values, tmpData])
          } else {
            // 处于数组的开始，前面没有可更新的数据，则可以直接更新 state
            // 或者异常情况：promise 不存在于数组中，还是去更新 state
            tmpData = mergeCurToPre([glueState, tmpData]);
          }
        } else {
          // 从原始数组删除 promise
          rq.replace(promise);
          raceHandle(promise, depsClearCallback, errorFlag);
        }
        if (!silent) {
          // 异步回调中延续依赖
          runtimeVar.runtimeDepsModelCollectedMap = forAsyncRuntimeDepsModelCollectedMap;
          runtimeVar.runtimeUpdateOrigin = forAsyncRuntimeUpdateOrigin;
          runtimeVar.runtimeRacePromisesCollectedSet = forAsyncRuntimeRacePromisesCollectedSet;
          runtimeVar.runtimeBeginOriginId = forAsyncRuntimeBeginOriginId;
        }
        updateFn(tmpData, silent, mutedCallback);
        if (!silent) {
          // 每次异步回调都相当于是一个开始，所以需要在异步回调执行完成时将依赖清空
          runtimeVar.runtimeDepsModelCollectedMap.clear();
          runtimeVar.runtimeUpdateOrigin = null;
          runtimeVar.runtimeRacePromisesCollectedSet = null;
          runtimeVar.runtimeBeginOriginId = null;
        }
        return tmpData;
      });

      if (isDevelopment()) {
        tagPromise(promise);
      }
      deleteSelf();
      // 返回函数处理结果
      return promise;
    }
    let finalTempResult = tempResult;
    // merge 策略也对同步生效
    if (glueConfig?.updatePolicy === GlueConflictPolicy.merge) {
      finalTempResult = mergeCurToPre([glueState, tempResult]);
    }

    updateFn(finalTempResult, silent, mutedCallback);
    deleteSelf();
    // 返回函数处理结果
    return finalTempResult;
  }

  fn = basicLogic(false);

  fn.reset = () => {
    fn(initState);
  }

  fn.watch = (models: FemoModel<any>[], callback: (data: any[], state: typeof glueState) => any) => {
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

  fn.onChange = (callback: (state: typeof glueState) => void) => {
    if (typeof callback !== 'function') {
      throw new Error('callback should be function');
    }

    return subscribe([fn], callback, false);
  }

  fn.onUpdate = (callback: (state: typeof glueState) => void) => {
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
    const realValue = fn.preTreat(...as);
    const realValueIsAsync = isAsync(realValue);
    let tmp: RacePromise = Promise.resolve(realValue);

    if (!modelToRacePromisesMap.has(fn)) {
      // 需要在 fn 被解绑监听时删除掉，所有绑定都没有了才删
      modelToRacePromisesMap.set(fn, new Set());
    }
    // 这是收集：以当前 model 作为起点的、自当前 model 变更而起的在回调（onChange/onUpdate）里面引发的其他 model.race 的竞态 promise，只收集回调里面引发的竞态 promise
    // 这个是为了解决不同 model 间链式的竞态问题。model_1.race -> onChange -> model_2.race
    const underModelCallbackContextRacePromises = modelToRacePromisesMap.get(fn) as Set<RacePromise>;
    const iumcc = isUnderModelCallbackContext();
    if (typeof runtimeVar.runtimeBeginOriginId !== 'number') {
      runtimeVar.runtimeBeginOriginId = runtimeVar.runtimeUpdateOriginId;
    }
    // 当不在回调上下文时，当前 model 就是起点，则将以该 model 为起点的 race promise 全部置为失效，因为这是开启新一次竞态更新了，得把上一次还未完成的清理掉
    if (!iumcc) {
      // 不是在回调环境的，则将之前收集到的所有 race promise 置为失效
      // 每次异步调用 race ，都视为一次新开始（同循环依赖判断）
      // TODO 将来可能需要对异步里调用 race 的情况也做上下文判断(比如：是在 model change 对 race 做的异步调用，那么该异步调用也继承是在 model change 调用的这一标识，而现在是重新开始)
      underModelCallbackContextRacePromises.forEach((p) => {
        // 现在的 race promise 没有区分是由 useModel 引起的，还是由 model.race 引起的
        // 一旦 调用 model.race 会将所有的 race promise（不管是 useModel，还是 model.race 引起的）置为无效
        // TODO 这里可能在后面需要区分，由 useModel 产生的 race promise 只能由 useModel 取消，由 model.race 产生的 race promise 只能由 model.race 取消
        // TODO 这里可能还要再区分，由 onChange 产生的 race promise 和 由 onUpdate 产生的 race promise (这点存疑，需要再考虑)
        makeRacePromiseDeprecated(p, runtimeVar.runtimeBeginOriginId);
      });
      underModelCallbackContextRacePromises.clear();
      runtimeVar.runtimeRacePromisesCollectedSet = underModelCallbackContextRacePromises;
    }

    // 不执行回调的依赖数组
    // 第三个参数默认就是 mutedCallback
    const [, ,mutedCallback] = as;
    // race 里面再次调用模型更新，不再做 preTreat 处理
    runtimeVar.runtimeNoPreTreat = true;
    if (realValueIsAsync) {
      tmp = fn(realValue, defaultReducer, mutedCallback);
    } else {
      fn(realValue, defaultReducer, mutedCallback);
    }
    // 如果是在回调上下文中执行的 model.race，说明当前 model 是其他 model.race 回调的一环，需要添加到 runtimeRacePromisesCollectedSet 中去
    if (iumcc && realValueIsAsync) {
      if (typeof runtimeVar.runtimeBeginOriginId === 'number') {
        tmp.originId = runtimeVar.runtimeBeginOriginId;
      }
      runtimeVar.runtimeRacePromisesCollectedSet?.add(tmp);
    }
    runtimeVar.runtimeBeginOriginId = null;
    rq.push(realValueIsAsync ? tmp : realValue, runtimeVar.runtimePromiseDeprecatedFlag);
    return tmp;
  };

  fn.preTreat = (...as: any) => preTreat(...as);

  fn.config = (...as: any[]) => {
    if (as.length === 0) return glueConfig;
    [glueConfig] = as;
    return glueConfig;
  }

  Object.defineProperty(fn, gluerUniqueFlagKey, {
    value: gluerUniqueFlagValue,
    writable: false,
    configurable: true,
    enumerable: true,
  });

  return fn;
}

export default glue;
