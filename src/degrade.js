
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
  model as femoModel
} from './constants'
import { glueAction } from './glueAction';
import isPlainObject from './tools/isPlainObject';
import { genReferencesMap } from './genProxy';
import referToState from './referToState';
import subscribe from './subscribe';

const defineInitStatePropsToFnc = (fnc, initState) => {
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
const getSubState = (actionData, kes) => {
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
const transformReducerToNestFnc = (k, redu) => {
  const kArr = k.split(uniqueTypeConnect);
  return kArr.reduceRight((pre, cur) => (ac, state) => {
    // 这里做了一个优化，如果节点返回值与传入state一致则不更新
    // return { ...state, [`${cur}`]: pre(state[`${cur}`], ac) }
    const curValue = state[cur];
    const temp = pre(ac, curValue);
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

/**
 * 判断action creator是否已经处理过
 * @param actionFn
 * @returns {boolean}
 */
const isGlueAction = actionFn => (actionFn[syncActionFnFlag] === syncActionFnFlagValue);
const actionError = (actionFn, obj, key) => {
  if (isGlueAction(actionFn)) {
    console.trace();
    throw new Error(`the "${key}" of ${obj}, which only can be processed only once, is already processed`);
  }
};

/**
 * 递归对象，生成标准的action以及链接reducer对象的键值与action的type
 */
const degrade = (model) =>{
  const femo = {
    [globalState]: {},
    [referencesMap]: genReferencesMap(),
    [referenceToDepsMap]: new Map(),
    [depsToCallbackMap]: new Map(),
    [femoModel]: model
  };
  const fn = (curObj, keyStr = [], topNode = curObj, df = femo[globalState], originalNode = null, originalKey = '') => {
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
            const nodeReducer = transformReducerToNestFnc(str, reducer);
            // 进行类似bindActionCreators的动作
            // 此处向action函数添加其对应的type属性，以便可以和其他以type为判断条件的中间件协同工作，比如redux-saga
            const acType = `${glueStatePrefix}${syncActionType}`;
            const action = glueAction({
              type: acType,
              action: actionFn,
              reducer: nodeReducer,
              femo
            });
            // 重新赋值
            /* eslint no-param-reassign:0 */
            curObj[key] = action;
            const isPlainObjectflag = isPlainObject(initState)
            if (isPlainObjectflag) {
              /* eslint-disable no-param-reassign */
              // 设置初始值
              // 当初始值作为数据结构时，引用会冲突（因为它还做action触发），需要进行复制
              df[key] = { ...initState };
            } else {
              df[key] = initState;
            }

            if (originalKey) {
              const originalAction = originalNode[originalKey];
              const originalReducerInAction = originalAction[reducerInAction];
              // eslint-disable-next-line no-useless-escape
              const subKeysStr = acType.replace(new RegExp(`${originalKey}\.`), '');
              const keyArr = subKeysStr.split(uniqueTypeConnect);
              // 重写action的reducer
              originalAction[reducerInAction] = (ac, state) => {
                const { data, type } = ac;
                const { flag, result } = getSubState(data, keyArr);
                let stateInit = state;
                if (flag) {
                  const subReducer = curObj[key][reducerInAction];
                  stateInit = subReducer({ type, data: result }, state);
                }
                return originalReducerInAction(ac, stateInit);
              };
            }
            // 索引引用的键值路径
            femo[referencesMap].set(action, str);
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
    } else if (!originalNode) {
      throw new Error('the argument muse be plain object!');
    } else {
      // 非普通对象的initialState暂不处理
      return null;
    }
    const reToStateFn = referToState(femo);
    return {
      getState: () => femo[globalState],
      referToState: (m) => reToStateFn(m),
      hasModel: (m) => femo[referencesMap].has(m),
      subscribe: subscribe(femo, reToStateFn),
      model: curObj
    };
  };
  return fn(model);
};
export { degrade };
export default degrade;
