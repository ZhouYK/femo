import {
    syncActionFnFlag,
    syncActionFnFlagValue,
    actionType,
    reducerInAction,
    globalState,
    depsToCallbackMap,
} from './constants';
import { isAsyncFunction } from './tools';
import { InnerFemo, Bridge } from './interface';

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

export const glueAction = (params: GlueActionParams) => {
    const { action, reducer, type, femo, bridge } = params;
    const actionDispatch: ActionDispatch = function (payload: any, customHandler?: typeof reducer) {
        const data = action(payload);
        const actionObj = { type, data };
        const handleFunc = actionDispatch[reducerInAction];
        // 处理state数据
        const handleAndPublish = () => {
            const result = handleFunc(actionObj, femo[globalState], customHandler);
            const state = femo[globalState];
            // reducer里面对async做了处理：不更新数据，原样返回state
            // 不会进入下面的条件
            if (!Object.is(result, state)) {
                femo[globalState] = result;
                femo[depsToCallbackMap].forEach((value, key) => {
                    value(...key);
                });
            }
        }
        handleAndPublish();
        if (isAsyncFunction(customHandler)) {
            return bridge.result.then((res: any) => {
                actionObj.data = res;
                handleAndPublish();
                return res;
            })
        }
        return bridge.result;
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
