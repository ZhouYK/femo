import { syncActionFnFlag, syncActionFnFlagValue, actionType, reducerInAction, globalState, depsToCallbackMap } from './constants';

export const glueAction = (params) => {
  const { action, reducer, type, femo } = params;
  const actionDispatch = function (...args) {
    const data = action(...args);
    const actionObj = { type, data };
    // 处理state数据
    const result = actionDispatch[reducerInAction](actionObj, femo[globalState]);
    const state = femo[globalState];
    if (!Object.is(result, state)) {
      femo[globalState] = result;
      femo[depsToCallbackMap].forEach((value, key) => {
        value(...key);
      });
    }
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
      writable: true,
      enumerable: false
    }
  });
  return actionDispatch;
};
export default glueAction;
