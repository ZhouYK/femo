import {
    syncActionFnFlag,
    syncActionFnFlagValue,
    actionType,
    reducerInAction,
    globalState,
    depsToCallbackMap,
    raceQueue,
    promiseDeprecated,
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

const promiseDeprecatedError = 'the promise is deprecated';

const raceHandle = (bridgeResult: Promise<any> & { [raceQueue]: RaceQueue }) => {
  if (promiseDeprecated in bridgeResult) {
    throw promiseDeprecatedError;
  }

  if (raceQueue in bridgeResult) {
    const value: RaceQueue = bridgeResult[raceQueue];
    for (let i = 0; i < value.length; i += 1) {
      const cur = value[i];
      const index = cur.indexOf(bridgeResult);
      if (index !== -1) {
        for (let j = 0; j <= index; j += 1) {
          cur[j][promiseDeprecated] = true;
        }
        cur.splice(0, index + 1);
      }
    }
    delete bridgeResult[raceQueue];
  }
}

export const glueAction = (params: GlueActionParams) => {
    const { action, reducer, type, femo, bridge } = params;
    const actionDispatch: ActionDispatch = function (payload: any, customHandler?: typeof reducer) {
      const data = action(payload);
      const actionObj = { type, data };
      const handleFunc = actionDispatch[reducerInAction];
      // 处理state数据
      const result = handleFunc(actionObj, femo[globalState], customHandler);
      const { result: bridgeResult } = bridge;

      if (isAsync(customHandler) || isAsync(bridge.result)) {
        bridgeResult.catch((e: any) => {
          raceHandle(bridgeResult);
          return Promise.reject(e);
        }).then((res: any) => {
          raceHandle(bridgeResult);
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
        return bridgeResult;
      }
      const state = femo[globalState];
      if (!Object.is(result, state)) {
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
