import { syncActionFnFlag, syncActionFnFlagValue, actionType, reducerInAction, globalState } from './constants';
import femo from './femo';

export const glueAction = (params) => {
  const { action, reducer, type } = params;
  const actionDispatch = function (...args) {
    const data = action(...args);
    // 处理state数据
    const result = actionDispatch[reducerInAction]({ type, data }, femo[globalState]);
    femo[globalState] = result;
    console.log(`触发: ${type}，数据: ${data}，结果：${result}`);
    return data;
  };
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
      writable: false,
      enumerable: false
    }
  });
  return actionDispatch;
};
export default glueAction;
