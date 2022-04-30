import {Callback, GluerReturn} from '../index';
import { isArray } from './tools';

export const refToDepsMap = new Map<GluerReturn<any>, Set<GluerReturn<any>[]>>();
export const depsToFnMap = new Map<GluerReturn<any>[], Set<Callback>>();

export const modelToCallbacksMap = new Map<GluerReturn<any>, Set<Callback>>();
export const callbackToModelsMap = new Map<Callback, Set<GluerReturn<any>>>();

export const maintainCallbackToModelsMap = () => {
  const mods = Array.from(modelToCallbacksMap.keys());
  const l = mods.length;
  callbackToModelsMap.forEach((models: Set<GluerReturn<any>>, cb: Callback) => {
    let flag = false;
    for (let i = 0; i < l; i += 1) {
      const ms = mods[i];
      if (models.has(ms)) {
        const cbs = modelToCallbacksMap.get(ms);
        if (cbs?.has(cb)) {
          flag = true;
          break;
        }
      }
    }
    if (!flag) {
      callbackToModelsMap.delete(cb);
    }
  })
}

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
      maintainCallbackToModelsMap();
      return;
    }
    // 如果是传的空数组或者不传，则在所有model中去删除传入的callback
    modelToCallbacksMap.forEach((cbSet, model) => {
      delCallback(model, cbSet);
    });
    maintainCallbackToModelsMap();
    return;
  }

  const l = targetDeps?.length ?? 0;
  for (let i = 0; i < l; i += 1) {
    const model = targetDeps?.[i] as GluerReturn<any>;
    const set = modelToCallbacksMap.get(model);
    set?.clear();
    modelToCallbacksMap.delete(model);
  }
  maintainCallbackToModelsMap();
}

export default unsubscribe;
