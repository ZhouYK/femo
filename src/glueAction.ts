import {
  syncActionFnFlag,
  syncActionFnFlagValue,
  actionType,
  reducerInAction,
  globalState,
  depsToCallbackMap,
  raceQueue,
  promiseDeprecated,
  uniqueTypeConnect,
} from './constants';
import { isAsync } from './tools';
import {InnerFemo, Bridge, RaceQueue} from './interface';

interface GlueActionParams {
  type: string;
  action: ActionCreatorFn;
  reducer: Reducer;
  femo: InnerFemo;
  bridge: Bridge;
}
export type ActionDispatch = {
  [reducerInAction]: Reducer,
  readonly [syncActionFnFlag]: symbol,
  readonly [actionType]: string,
} & ActionCreatorFn;

export const promiseDeprecatedError = 'the promise is deprecated';

const raceHandle = (promise: Promise<any> & { [raceQueue]: RaceQueue; [promiseDeprecated]: boolean }) => {

  if (raceQueue in promise) {
    // const value: RaceQueue = promise[raceQueue];
    // for (let i = 0; i < value.length; i += 1) {
    //   const cur = value[i];
    //   const index = cur.indexOf(promise);
    //   if (index !== -1) {
    //     for (let j = 0; j <= index; j += 1) {
    //       cur[j][promiseDeprecated] = true;
    //     }
    //     cur.splice(0, index + 1);
    //   }
    // }
    delete promise[raceQueue];
  }

  if (promiseDeprecated in promise) {
    throw promiseDeprecatedError;
  }

  promise[promiseDeprecated] = true;
}

export const glueAction = (params: GlueActionParams) => {
  const { action, reducer, type, femo, bridge } = params;
  const actionDispatch: ActionDispatch = function (...args: any[]) {
    let payload;
    let customHandler;
    const femoState = femo[globalState];
    if (args.length === 0) {
      // 没有传入任何参数 不做任何更新
      const dataPathInState = type.split(uniqueTypeConnect);
      // 直接返回
      return dataPathInState.reduce((pre, cur, index) => {
        if (index === 0) return pre;
        return pre[cur];
      }, femoState);
    } else if (args.length === 1) {
      // 只有一个传参
      if (typeof args[0] === 'function') {
        customHandler = args[0];
      } else {
        payload = args[0];
      }
    } else {
      [payload, customHandler] = args;
    }

    const data = action(payload);
    const actionObj = { type, data };
    const handleFunc = actionDispatch[reducerInAction];
    // 处理state数据
    const result = handleFunc(actionObj, femoState, customHandler);
    const { result: bridgeResult } = bridge;

    bridge.result = null;
    if (isAsync(customHandler) || isAsync(bridgeResult)) {
      const promise = bridgeResult.catch((e: any) => {
        raceHandle(promise);
        return Promise.reject(e);
      }).then((res: any) => {
        raceHandle(promise);
        actionObj.data = res;
        // 这里不传入customHandler，已经在这里调过一次 const result = handleFunc(actionObj, femo[globalState], customHandler);
        // 需要传入一个简单的reducer函数: f(x) = x。为了避免gluer定义的处理函数被调用
        const state = femo[globalState];
        const innerResult = handleFunc(actionObj, state, (data) => data);
        if (!Object.is(innerResult, state)) {
          femo[globalState] = innerResult;
          femo[depsToCallbackMap].forEach((value, key) => {
            value(...key);
          });
        }
        return res;
      });
      return promise;
    }
    if (!Object.is(result, femoState)) {
      femo[globalState] = result;
      femo[depsToCallbackMap].forEach((value, key) => {
        value(...key);
      });
    }
    return bridgeResult;
  } as ActionDispatch;
  Object.defineProperties(actionDispatch, {
    [syncActionFnFlag]: {
      value: syncActionFnFlagValue,
      configurable: false,
      writable: false,
      enumerable: false,
    },
    [actionType]: {
      value: type,
      configurable: false,
      writable: false,
      enumerable: true,
    },
    [reducerInAction]: {
      value: reducer,
      configurable: false,
      writable: true,
      enumerable: false
    }
  });
  return actionDispatch;
};
export default glueAction;
