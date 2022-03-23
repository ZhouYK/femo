import {Callback, GluerReturn} from '../index';

export const refToDepsMap = new Map<GluerReturn<any>, Set<GluerReturn<any>[]>>();
export const depsToFnMap = new Map<GluerReturn<any>[], Set<Callback>>();

export const deleteDepsInRefToDepsMap = (targetDeps: GluerReturn<any>[]) => {
  refToDepsMap.forEach((value, key) => {
    value.delete(targetDeps);
    // 没有依赖数组的model节点，直接删除掉
    if (value.size === 0) {
      refToDepsMap.delete(key);
    }
  });
}

const unsubscribe = (targetDeps?: GluerReturn<any>[], callback?: Callback) => {
  if (targetDeps === undefined && callback === undefined) {
    refToDepsMap.clear();
    depsToFnMap.clear();
    return;
  }
  if (!Object.is(targetDeps, undefined) && !Object.is(callback, undefined)) {
    if (typeof callback !== 'function') {
      console.warn('unsubscribe`s param: callback, should be function')
    }
    const fns = (depsToFnMap.get(targetDeps as GluerReturn<any>[]) || new Set()) as Set<Callback>;
    fns.delete(callback as Callback);
    if (fns.size !== 0) {
      return;
    }
  } else if (Object.is(targetDeps, undefined) && !Object.is(callback, undefined)) {
    // todo 将来再加这个的解除功能吧
    console.warn('unsubscribe`s param: targetDeps, should not be undefined');
    return;
  }
  depsToFnMap.delete(targetDeps);
  deleteDepsInRefToDepsMap(targetDeps);
}

export default unsubscribe;
