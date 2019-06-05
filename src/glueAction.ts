import {
  syncActionFnFlag,
  syncActionFnFlagValue,
  actionType,
  reducerInAction,
  globalState,
  depsToCallbackMap, referencesMap, referenceToDepsMap, model as femoModel
} from './constants';

type fnc = (...params: any[]) => any;

export interface InnerFemo {
  [globalState]: {
    [index: string]: any;
  },
  [referencesMap]: Map<any, string|symbol> | WrapMap,
  [referenceToDepsMap]: Map<any, any[]>,
  [depsToCallbackMap]: Map<any[], fnc>,
  [femoModel]: { [index: string]: any }
}

interface GlueActionParams {
  type: string;
  action: ActionCreatorFn,
  reducer: Reducer,
  femo: InnerFemo
}
export type ActionDispatch = {
  [reducerInAction]: Reducer,
  readonly [syncActionFnFlag]: symbol,
  readonly [actionType]: string,
} & ActionCreatorFn;

export const glueAction = (params: GlueActionParams) => {
  const { action, reducer, type, femo } = params;
  const actionDispatch: ActionDispatch = function (...args) {
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