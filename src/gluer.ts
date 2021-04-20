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
import genRaceQueue from "./genRaceQueue";

export const promiseDeprecatedError = 'the promise is deprecated';
const defaultReducer = (data: any, _state: any) => data;
const warning = 'highly recommend setting the initial state with the reducer：';
const getWarning = (rd: HandleFunc<any, any, any>) => `${warning}${rd.toString()}`;
const raceHandle = (promise: Promise<any> & { [raceQueue]?: RaceQueue; [promiseDeprecated]?: boolean }) => {

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
function gluer<S, D = any, R = S>(fn: HandleFunc<S, D, R>) : GluerReturn<S, R>;
function gluer<S, D = any, R = S>(initialState: S) : GluerReturn<S, R>;
function gluer<S, D = any, R = S>(fn:  HandleFunc<S, D, R>, initialState: S) : GluerReturn<S, R>;
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
  const trackArr: any[] = [];
  let curIndex: number = 0;
  const raceQueue = genRaceQueue();

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
      const targetDeps: GluerReturn<any, any>[][] = refToDepsMap.get(fn);
      if (targetDeps) {
        targetDeps.forEach((target: GluerReturn<any, any>[]) => {
          const callback = depsToFnMap.get(target);
          callback(...target);
        })
      }
    }
  }

  const updateFn = (data: any, silent: boolean) => {
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
        const targetDeps: GluerReturn<any, any>[][] = refToDepsMap.get(fn);
        if (targetDeps) {
          targetDeps.forEach((target: GluerReturn<any, any>[]) => {
            const callback = depsToFnMap.get(target);
            callback(...target);
          })
        }
      }
    }
  }

  const basicLogic = (silent = false) => (...args: any[]) => {
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
        updateFn(data, silent);
        return data;
      });
      // 返回函数处理结果
      return promise;
    }

    updateFn(tempResult, silent);
    // 返回函数处理结果
    return tempResult;
  }

  const fn: any = basicLogic(false);

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
    historyGoUpdateFn(step);
    return gluerState;
  }

  fn.race = (customHandler: <S>(data: any, state: S) => Promise<S>) => raceQueue.push(fn(customHandler));

  Object.defineProperty(fn, gluerUniqueFlagKey, {
    value: gluerUniqueFlagValue,
    writable: false,
    configurable: true,
    enumerable: true,
  });
  return fn;
}

export default gluer;
