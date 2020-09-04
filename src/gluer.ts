import {
  development,
  raceQueue,
  promiseDeprecated,
  gluerUniqueFlagKey,
  gluerUniqueFlagValue,
} from './constants';

import { HandleFunc, GluerReturn } from '../index';
import {isArray, isAsync} from "./tools";
import {RaceQueue} from "./interface";
import subscribe, {depsToFnMap, refToDepsMap} from "./subscribe";

export const promiseDeprecatedError = 'the promise is deprecated';
const defaultReducer = (data: any, _state: any) => data;
const warning = 'highly recommend setting the initial state with the reducer：';
const getWarning = (rd: HandleFunc<any, any, any>) => `${warning}${rd.toString()}`;
const raceHandle = (promise: Promise<any> & { [raceQueue]: RaceQueue; [promiseDeprecated]: boolean }) => {

  if (raceQueue in promise) {
    delete promise[raceQueue];
  }

  if (promiseDeprecated in promise) {
    throw promiseDeprecatedError;
  }

  promise[promiseDeprecated] = true;
}
/**
 * 节点生成函数
 * @returns {function(): {action: *, reducer: *, initState: *}}
 * @param fn
 */
function gluer<S = any, D = S, R = Partial<S>>(fn: HandleFunc<S, D, R>) : GluerReturn<S, R>;
function gluer<S, D, R = any>(initialState: S) : GluerReturn<S, R>;
function gluer<S = any, D = S, R = Partial<S>>(fn:  HandleFunc<S, D, R>, initialState: S) : GluerReturn<S, R>;
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
      if (process.env.NODE_ENV === development) {
        throw new Error(getWarning(rd));
      }
    }
  } else {
    if (typeof rd !== 'function') {
      throw new Error('first argument must be function');
    }
    reducerFnc = rd;
    if (process.env.NODE_ENV === development) {
      if (initialState === undefined) {
        throw new Error(getWarning(rd));
      }
    }
  }

  let gluerState = initState;

  const fn = (...args: any[]) => {
    let payload;
    let customHandler;
    if (args.length === 0) {
      // 直接返回
      return gluerState;
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

    const realHandler = customHandler || reducerFnc;

    const tempResult = realHandler(payload, gluerState);

    // 如果是异步更新
    if (isAsync(tempResult)) {
      const promise: any = (tempResult as Promise<any>).catch(e => {
        raceHandle(promise);
        return Promise.reject(e);
      }).then((data) => {
        raceHandle(promise);
        if (!(Object.is(data, gluerState))) {
          gluerState = data;
          const targetDeps: GluerReturn<any, any>[][] = refToDepsMap.get(fn);
          if (targetDeps) {
            targetDeps.forEach((target: GluerReturn<any, any>[]) => {
              const callback = depsToFnMap.get(target);
              callback(...target);
            })
          }
        }
        return data;
      });
      // 返回函数处理结果
      return promise;
    }

    if (!(Object.is(tempResult, gluerState))) {
      gluerState = tempResult;
      const targetDeps: GluerReturn<any, any>[][] = refToDepsMap.get(fn);
      if (targetDeps) {
        targetDeps.forEach((target: GluerReturn<any, any>[]) => {
          const callback = depsToFnMap.get(target);
          callback(...target);
        })
      }
    }
    // 返回函数处理结果
    return tempResult;
  };

  fn.reset = () => {
    fn(initState);
  }

  fn.relyOn = (model: any[], callback: (data: any[], state: any) => any) => {
    let innerModel = [];
    if (isArray(model)) {
      innerModel = model;
    } else {
      throw new Error('dependencies should be Array');
    }

    let unsub = () => {};
    if (innerModel.length !== 0) {
      unsub = subscribe(innerModel, (...data: any[]) => {
        const modelData = data;
        fn(() => callback(modelData, fn()));
      }, false);
    }
    return unsub;
  };
  Object.defineProperty(fn, gluerUniqueFlagKey, {
    value: gluerUniqueFlagValue,
    writable: false,
    configurable: true,
    enumerable: true,
  });
  return fn;
}

export default gluer;
