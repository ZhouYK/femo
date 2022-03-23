import { Callback, GluerReturn, HandleFunc, RacePromise, RaceQueueObj } from '../../index';
import { promiseDeprecated } from '../constants';
import genRaceQueue, { ErrorFlag, promiseDeprecatedError } from '../genRaceQueue';
import runtimeVar from '../runtimeVar';
import { isAsync, isTagged, tagPromise } from '../tools';
import { depsToFnMap, refToDepsMap } from '../unsubscribe';

export interface GluerInstanceContext<S = any> {
  reducerFnc: Reducer;
  initState: S;

  gluerState: S;

  trackArr: S[];
  curIndex: number;

  rq: RaceQueueObj;

  unsubscribeRelyArr:(() => void)[];

  cachedData: S;
  cachedFlag: boolean;
  fromCache: boolean;

  fn: GluerReturn<any> & GluerInstanceContext;
  selfDeps: GluerReturn<any>[];

}

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

export const defaultReducer = (data: any, _state: any) => data;


export const initContext = (): GluerInstanceContext => {

  return {
    initState: undefined,
    reducerFnc: () => {},

    gluerState: undefined,

    trackArr: [],
    curIndex: 0,

    rq: genRaceQueue(),

    unsubscribeRelyArr: [],

    cachedData: undefined,
    cachedFlag: false,
    fromCache: false,

    fn: undefined,
    selfDeps: [],
  }
}

export const handleArgs = function (this: GluerInstanceContext, ...args: any[]): void {
  const [rd, initialState] = args;
  this.initState = initialState;
  // 没有传入任何参数则默认生成一个reducer
  if (args.length === 0) {
    // 默认值reducer
    this.reducerFnc = defaultReducer;
  } else if (args.length === 1) {
    // 会被当做初始值处理
    if (typeof rd !== 'function') {
      // 默认生成一个reducer
      this.reducerFnc = defaultReducer;
      // 初始值
      this.initState = rd;
    } else {
      this.reducerFnc = rd;
      if (process.env.NODE_ENV === 'development') {
        console.warn(getWarning(rd));
      }
    }
  } else {
    if (typeof rd !== 'function') {
      throw new Error('first argument must be function');
    }
    this.reducerFnc = rd;
  }
  this.gluerState = this.initState;
}


/**
 *
 * @param data
 * @param silent
 * @param mutedDeps 不执行其回调的依赖数组
 * @param curFromCache 是否来自cache方法的异步更新，默认 false（否）
 */
const updateFn = function (this: GluerInstanceContext & GluerReturn<any>, data: any, silent: boolean, mutedDeps: GluerReturn<any>[][] = [], curFromCache: boolean) {
  const { cachedFlag, gluerState, trackArr, curIndex } = this;

  if (curFromCache && !cachedFlag) {
    this.cachedFlag = true;
    this.cachedData = data;
  }

  if (!(Object.is(data, gluerState))) {
    this.gluerState = data;
    if (!silent) {
      const { length } = trackArr;
      if (length) {
        if (curIndex < length - 1) {
          trackArr.splice(curIndex + 1);
        }
        trackArr.push(data);
        this.curIndex = curIndex + 1;
      }
      const targetDeps = refToDepsMap.get(this) as Set<GluerReturn<any>[]>;
      if (targetDeps) {
        targetDeps.forEach((target) => {
          if (!mutedDeps.includes(target)) {
            executeCallback(target);
          }
        })
      }
    }
  }
}

export const preTreat = function<S = any>(this: GluerInstanceContext & GluerReturn<any>, ...args: any[]): S {
  let payload;
  let customHandler;
  const { gluerState } = this;
  if (args.length === 0) {
    // 直接返回
    return gluerState;
  } if (args.length === 1) {
    // 只有一个传参
    if (typeof args[0] === 'function') {
      [customHandler] = args;
    } else {
      [payload] = args;
    }
  } else {
    [payload, customHandler] = args;
  }

  const { reducerFnc } = this;

  const realHandler = customHandler || reducerFnc;

  return realHandler(payload, gluerState);
}

/**
 *
 * @param silent 是否静默更新
 * @param context
 */
export const basicLogic = (silent: boolean) => function (this: GluerInstanceContext,...args: any[]){
  // 所有的属性都从fn上获取
  // 因为basicLogic有两个地方在用：fn = basicLogic(false).bind(context)和fn.silent = basicLogic(true)
  // 二者this的指向不一样，为了保证数据来源一致，都只从 this.fn上面取数据
  const self = this.fn;
  const tempResult = preTreat.apply(self, args) as any;
  if (args.length === 0) return tempResult;
  const { fromCache } = self;
  if (!silent) {
    // 如果在model的调用链中出现过，则中断循环更新，不再执行
    if (runtimeVar.runtimeDepsModelCollectedMap.has(self)) return tempResult;
    runtimeVar.runtimeDepsModelCollectedMap.set(self, 0); // 追踪依赖
  }

  const deleteSelf = () => {
    if (!silent) {
      // 删掉自己
      runtimeVar.runtimeDepsModelCollectedMap.delete(self);
    }
  };
  // 不执行回调的依赖数组
  // 第三个参数默认就是mutedDeps
  const [, ,mutedDeps] = args;
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
      updateFn.call(self, data, silent, mutedDeps, tmpFromCache);
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

  updateFn.call(self, tempResult, silent, mutedDeps, false);
  deleteSelf();
  // 返回函数处理结果
  return tempResult;
}

export const historyGoUpdateFn = function (this: GluerInstanceContext & GluerReturn<any>, step: number) {
  const { trackArr } = this;
  let { curIndex } = this;
  const { length } = trackArr;
  if (length === 0) {
    return;
  }
  curIndex += step;
  const { gluerState } = this;
  if (curIndex < 0) {
    curIndex = 0;
  } else if (curIndex > length - 1) {
    curIndex = length - 1;
 }
  const data = trackArr[curIndex];
  this.curIndex = curIndex;
  if (!(Object.is(data, gluerState))) {
    this.gluerState = data;
    const targetDeps = refToDepsMap.get(this) as Set<GluerReturn<any>[]>;
    if (targetDeps) {
      targetDeps.forEach((targetDep) => {
        executeCallback(targetDep);
      })
    }
  }
}


