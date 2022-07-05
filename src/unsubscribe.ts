import {Callback, GluerReturn} from '../index';
import { isArray } from './tools';

export const modelToCallbacksMap = new Map<GluerReturn<any>, Set<Callback>>();
export const callbackToModelsMap = new Map<Callback, Set<GluerReturn<any>>>();
export const idToCallbackMap = new Map<number, Callback>();

const unsubscribe = (targetDeps?: GluerReturn<any>[], callback?: Callback | Callback[]) => {
  if (!targetDeps && !callback) {
    modelToCallbacksMap.clear();
    callbackToModelsMap.clear();
    return;
  }

  if (callback) {
    let callbacks: Callback[];
    if (isArray(callback)) {
      callbacks = callback as Callback[];
    } else {
      callbacks = [callback as Callback];
    }
    const cl = callbacks.length;

    const delCallback = (model: GluerReturn<any>, cbs?: Set<Callback>) => {
      if (cbs) {
        for (let j = 0; j < cl; j += 1) {
          const cb = callbacks[j];
          cbs.delete(cb);
          // 这里能够保证删除都是一起删除
          /**
           * 比如 [a, b, c] -> callback_1
           * [a, d, e] -> callback_2
           * 当出现在a中删除callback_1时，一定是a,b,c同时删除callback_1，因为解绑都是通过返回的闭包解绑的
           * 当在a中删除callback_2时，一定是a,d,e同时删除callback_2，原因同上。
           * 所以可以在此时同时删除掉 callbackToModelsMap 中的 callback_1和callback_2
           */
          if (callbackToModelsMap.has(cb)) {
            callbackToModelsMap.delete(cb);
          }
        }
        if (cbs.size === 0) {
          modelToCallbacksMap.delete(model);
        }
      }
    }

    const l = targetDeps?.length || 0;
    if (l) {
      for (let i = 0; i < l; i += 1) {
        const model = targetDeps?.[i] as GluerReturn<any>;
        const set = modelToCallbacksMap.get(model);
        delCallback(model, set);
      }
      return;
    }
    // 如果是传的空数组或者不传，则在所有model中去删除传入的callback
    modelToCallbacksMap.forEach((cbSet, model) => {
      delCallback(model, cbSet);
    });
    return;
  }

  const l = targetDeps?.length ?? 0;
  for (let i = 0; i < l; i += 1) {
    const model = targetDeps?.[i] as GluerReturn<any>;
    const set = modelToCallbacksMap.get(model);
    set?.forEach((cb) => {
      if (callbackToModelsMap.has(cb)) {
        callbackToModelsMap.delete(cb);
      }
    })
    set?.clear();
    modelToCallbacksMap.delete(model);
  }
}

export default unsubscribe;
