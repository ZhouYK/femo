import {
  gluerUniqueFlagKey,
  gluerUniqueFlagValue,
  uniqueTypeConnect,
  syncActionFnFlag,
  syncActionFnFlagValue,
  glueStatePrefix,
  development,
  reducerInAction,
  globalState,
  referencesMap,
  referenceToDepsMap,
  depsToCallbackMap,
  rootNodeMapKey,
  model as femoModel,
  raceQueue as raceQueueKey, promiseDeprecated,
} from './constants'
import {glueAction, ActionDispatch } from './glueAction';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore
import {isAsync, isPlainObject} from './tools';
import { genReferencesMap } from './genProxy';
import referToState from './referToState';
import subscribe from './subscribe';
import {Femo, InnerFemo, Bridge, RaceQueue} from './interface';

// 深克隆对象，不克隆非对象的数据（比如数组）
const deepClone = (target: any) => {
  if (isPlainObject(target)) {
    const result: { [index: string]: any } = {};
    Object.keys(target).forEach((key: string) => {
      result[key] = deepClone(target[key]);
    });
    return result;
  }
  return target;
}

const defineInitStatePropsToFnc = (fnc: ActionDispatch, initState: { [index: string]: any }) => {
  if (isPlainObject(initState)) {
    Object.keys(initState).forEach((propName) => {
      Object.defineProperty(fnc, propName, {
        value: initState[propName],
        writable: false,
        enumerable: true,
        configurable: false,
      });
    });
  }
};

/**
 * 从action.data中筛选出，kes对应的数据
 * @param actionData
 * @param kes
 * @returns {{result: null, flag: boolean}}
 */
const getSubState = (actionData: any, kes: string[]) => {
  let result = actionData;
  const final = {
    flag: false,
    result: null,
  };
  const { length } = kes;
  for (let i = 0; i < length; i += 1) {
    if (isPlainObject(result)) {
      const keys = Object.keys(result);
      if (keys.includes(kes[i])) {
        result = result[kes[i]];
        if (i === length - 1) {
          final.flag = true;
          final.result = result;
        }
      }
    }
  }
  return final;
};

/**
 * 生成顶层节点的reducer函数：将叶子节点的fnc进行重新包装成返回相应嵌套结构的state
 * @param k
 * @param redu
 * @returns {function(*, *=): {[p: string]: *}}
 */
const transformReducerToNestFnc = (k: string, redu: Reducer, bridge: Bridge) => {
  const kArr = k.split(uniqueTypeConnect);
  const { length } = kArr;
  return kArr.reduceRight((pre, cur, index) => (ac: FemoAction, state: { [index: string]: any }, customHandler?: Reducer) => {
    // 这里做了一个优化，如果节点返回值与传入state一致则不更新
    // return { ...state, [`${cur}`]: pre(state[`${cur}`], ac) }
    const curValue = state[cur];
    let info = ac;
    let temp;
    // 用户的reducer不处理 { type, data }，直接处理data
    // 为了ts验证时数据一致
    if (index === length - 1) {
      info = ac.data;
      // 这种写法会有问题：导致pre的值会被重写，并且之后所有的pre都将是重写过后的
      // pre 在这里是一个闭包里面局部变量，一旦被重写，后续将不会还原
      // pre = customHandler || pre;
      const final = customHandler || pre;
      temp = final(info, curValue);
      bridge.result = temp;
      // 如果是异步函数，则不更新state
      // 这个会在actionDispatch中再去调用一次，从而更新数据
      if (isAsync(customHandler) || isAsync(temp)) {
          return state;
      }
    } else {
      temp = pre(info, curValue, customHandler)
    }
    if (process.env.NODE_ENV === development) {
      if (Object.is(temp, undefined)) {
        console.error(`Warning：the reducer handling "${ac.type}" has returned "undefined"！`);
      }
    }
    if (Object.is(temp, curValue)) {
      return state;
    }
    return { ...state, [cur]: temp };
  }, redu);
};

interface PlainObject {
  [index: string]: any;
}

/**
 * 判断action creator是否已经处理过
 * @param actionFn
 * @returns {boolean}
 */
const isGlueAction = (actionFn: ActionDispatch) => (actionFn[syncActionFnFlag] === syncActionFnFlagValue);
const actionError = (actionFn: ActionDispatch, obj: { [index: string]: any } | { [index: number]: any }, key: string) => {
  if (isGlueAction(actionFn)) {
    throw new Error(`the "${key}" of ${obj}, which only can be processed only once, is already processed`);
  }
};

/**
 * 递归对象，生成标准的action以及链接reducer对象的键值与action的type
 */
const degrade = <T = PlainObject>(model: T): Femo<T> => {
  const femo: InnerFemo = {
    [globalState]: {},
    [referencesMap]: genReferencesMap(),
    [referenceToDepsMap]: new Map(),
    [depsToCallbackMap]: new Map(),
    [femoModel]: model,
};
  const raceQueuePool = new Map();

  const fn = (curObj: PlainObject, keyStr: string[] = [], topNode = curObj, df = femo[globalState], originalNode: PlainObject = {}, originalKey = '') => {
    if (isPlainObject(curObj)) {
      // 设置整个对象的索引
      // 整个model的引用
      // 第一次执行时
      if (curObj === topNode && keyStr.length === 0) {
        femo[referencesMap].set(curObj, rootNodeMapKey);
      }
      const keys = Object.keys(curObj);
      keys.forEach((key) => {
        const value = curObj[key];
        if (!Object.is(value, undefined) && !Object.is(value, null)) {
          // ⚠️
          actionError(value, curObj, key);
          keyStr.push(key);
          const str = keyStr.join(uniqueTypeConnect);
          // 如果是同步节点，则获取对应的action creator和reducer function
          if (value[gluerUniqueFlagKey] === gluerUniqueFlagValue) {
            const { action: actionFn, reducer, initState } = value();
            const syncActionType = key === str ? key : str;
            const bridge = {};
            const nodeReducer = transformReducerToNestFnc(str, reducer, bridge);
            // 进行类似bindActionCreators的动作
            // 此处向action函数添加其对应的type属性，以便可以和其他以type为判断条件的中间件协同工作，比如redux-saga
            const acType = `${glueStatePrefix}${syncActionType}`;
            const action = glueAction({
              type: acType,
              action: actionFn,
              reducer: nodeReducer,
              femo,
              bridge,
            });
            // 重新赋值
            /* eslint no-param-reassign:0 */
            curObj[key] = action;
            const isPlainObjectflag = isPlainObject(initState);
            if (isPlainObjectflag) {
              /* eslint-disable no-param-reassign */
              // 设置初始值
              // 当初始值作为数据结构时，引用会冲突（因为它还做action触发），需要进行复制
              // 浅复制会有问题，深层的initState的对象和asModel共享了。需要做个针对对象做深拷贝
              df[key] = deepClone(initState);
            } else {
              df[key] = initState;
            }

            if (originalKey) {
              const originalAction = originalNode[originalKey];
              const originalReducerInAction = originalAction[reducerInAction];
                // eslint-disable-next-line no-useless-escape
              const subKeysStr = acType.replace(new RegExp(`^${originalKey}\.`), '');
              const keyArr = subKeysStr.split(uniqueTypeConnect);
              // 重写action的reducer
              originalAction[reducerInAction] = (ac: FemoAction | any, state: any, customHandler?: Reducer) => {
                const { data, type } = ac;
                const { flag, result } = getSubState(data, keyArr);
                let stateInit = state;
                if (flag) {
                  const subReducer = curObj[key][reducerInAction];
                  stateInit = subReducer({ type, data: result }, state);
                }
                return originalReducerInAction(ac, stateInit, customHandler);
              };
            }
            // 索引引用的键值路径
            femo[referencesMap].set(action, str);
            // 对初始值进行遍历处理，因为可能包含gluer定义的节点
            if (isPlainObjectflag) {
              const asModel = { ...initState };
              // 遍历初始值，获取初始值中的结构信息
              fn(asModel, [...keyStr], asModel, df[key], curObj, key);
              defineInitStatePropsToFnc(action, asModel); // 整合initState,延长模型
            }
          } else if (isPlainObject(value)) {
            // 索引引用的键值路径
            femo[referencesMap].set(value, str);
            if (!df[key]) {
              df[key] = {};
            }
            fn(value, [...keyStr], topNode, df[key]);
          } else {
            if (process.env.NODE_ENV === development) {
              // 模型来自initialState时，不提示
              if (!originalNode) {
                console.error('Warning: the constant node: state.%s, %O.Directly placing constants in model is discouraged, because this leads data management to be confused. Leaf nodes except defined By "gluer" will not be traced. So please wrap it with "gluer".', keyStr.join('.'), value);
              }
            }
            // 不追踪非普通对象且非gluer声明的叶子节点，因为直接量的数据极易重复，导致索引覆盖
            // 索引引用的键值路径
            // femo[referencesMap].set(value, str);
            if (df) {
              df[key] = value;
            }
          }
          // 中止后返回上一节点检索
          keyStr.pop();
        }
      });
    } else if (!originalKey) {
      throw new Error('the argument muse be plain object!');
    }
  };
  fn(model);
  const reToStateFn = referToState(femo);
  return {
    getState: () => femo[globalState],
    referToState: (m: any) => reToStateFn(m),
    hasModel: (m: any) => femo[referencesMap].has(m),
    subscribe: subscribe(femo, reToStateFn),
    model,
    genRaceQueue: () => {
      let raceQueue: (Promise<any> & { [promiseDeprecated]?: boolean })[] | null = [];

      const obj = {
        push: (p: Promise<any> & { [raceQueueKey]?: RaceQueue } ) => {
          if (!(p instanceof Promise)) {
            throw "The race queue item should be Promise";
          }
          if (raceQueue) {
            raceQueue.forEach((promise) => {
              if (!(promiseDeprecated in promise)) {
                promise[promiseDeprecated]  = true;
              }
            });
            raceQueue.splice(0);
            raceQueue.push(p);
          } else {
            console.warn('the race queue has been destroyed');
            return;
          }

          // 如果已经属于一个异步队列了，则再加一个
          if (raceQueueKey in p) {
            const value = p[raceQueueKey];
            if (value && value.indexOf(raceQueue) === -1) {
              value.push(raceQueue);
            }
          } else {
            // 打标记
            Object.defineProperty(p, raceQueueKey, {
              value: [raceQueue],
              configurable: true, // 可删除
              writable: false,
              enumerable: true,
            });
          }
        },

        destroy: () => {
          raceQueuePool.delete(obj);
          if (raceQueue) {
            // 摧毁的时候，所有的promise都置为废弃状态
            raceQueue.forEach((rq) => {
              rq[promiseDeprecated] = true;
            });
            raceQueue.splice(0);
            raceQueue = null;
          }
        },

        __UNSAFE__getQueue: () => raceQueue,
      };
      raceQueuePool.set(obj, raceQueue);
      return obj;
    }
  };
};
export { degrade };
export default degrade;
