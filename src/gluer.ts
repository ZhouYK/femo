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
export const defaultReducer = (data: any, _state: any) => data;
const warning = '你只传入了一个函数参数给gluer，这会被认为是reducer函数而不是初始值。如果你想存储一个函数类型的初始值，请传入两个参数：reducer和初始值。' +
  'reducer可以是最简单：(data, state) => data。这个的意思是：传入的数据会直接用来更新state。';
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
      if (process.env.NODE_ENV === development) {
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

  let unsubscribeArr: (() => void)[] = [];

  let fn: any;

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
        const targetDeps: GluerReturn<any>[][] = refToDepsMap.get(fn);
        if (targetDeps) {
          targetDeps.forEach((target: GluerReturn<any>[]) => {
            const callback = depsToFnMap.get(target);
            callback(...target);
          })
        }
      }
    }
  }
  const basicLogic = (silent = false) => (...ags: any[]) => {
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
      const targetDeps: GluerReturn<any>[][] = refToDepsMap.get(fn);
      if (targetDeps) {
        targetDeps.forEach((target: GluerReturn<any>[]) => {
          const callback = depsToFnMap.get(target);
          callback(...target);
        })
      }
    }
  }

  fn = basicLogic(false);

  fn.reset = () => {
    if (typeof initState === 'function') {
      fn(() => initialState);
    } else {
      fn(initState);
    }
  }

  fn.relyOn = (model: GluerReturn<any>[], callback: (data: any[], state: typeof gluerState) => any) => {
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
      unsubscribeArr.push(unsub);
    }
    return unsub;
  };

  fn.off = () => {
    unsubscribeArr.forEach((f) => f());
    unsubscribeArr = [];
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
    historyGoUpdateFn(step);
    return gluerState;
  }

  fn.race = (...as: any[]) => rq.push(fn(...as));

  Object.defineProperty(fn, gluerUniqueFlagKey, {
    value: gluerUniqueFlagValue,
    writable: false,
    configurable: true,
    enumerable: true,
  });
  return fn;
}

export default gluer;
