import {Callback, GluerReturn} from '../index';

export const refToDepsMap = new Map<GluerReturn<any>, GluerReturn<any>[][]>();
export const depsToFnMap = new Map<GluerReturn<any>[], Callback[]>();

export const deleteDepsInRefToDepsMap = (targetDeps: GluerReturn<any>[]) => {
  refToDepsMap.forEach((value, key) => {
    for (let i = 0; i < value.length; i += 1) {
      if (value[i] === targetDeps) {
        value.splice(i, 1);
        break;
      }
    }
    // 没有依赖数组的model节点，直接删除掉
    if (value.length === 0) {
      refToDepsMap.delete(key);
    }
  });
}

const unsubscribe = (targetDeps?: GluerReturn<any>[], callback?: Callback) => {
  if (targetDeps === undefined && callback === undefined) {
    refToDepsMap.clear();
    depsToFnMap.clear();
  } else {
    if (!Object.is(targetDeps, undefined) && !Object.is(callback, undefined)) {
      if (typeof callback !== 'function') {
        console.warn('unsubscribe`s param: callback, should be function')
      }
      const fns = (depsToFnMap.get(targetDeps as GluerReturn<any>[]) || []) as Callback[];
      for (let k = 0; k < fns.length; k += 1) {
        const target = fns[k];
        // 在监听的时候如果依赖和函数都完全一样，不论订阅多少次都只记录一次
        if (Object.is(target, callback)) {
          fns.splice(k, 1);
          break;
        }
      }
      if (fns.length !== 0) {
        return;
      }
    }

    if (Object.is(targetDeps, undefined) && !Object.is(callback, undefined)) {
      // todo 将来再加这个的解除功能吧
      console.warn('unsubscribe`s param: targetDeps, should not be undefined');
    }

    depsToFnMap.delete(targetDeps as GluerReturn<any>[]);
    deleteDepsInRefToDepsMap(targetDeps as GluerReturn<any>[]);
  }
}

export default unsubscribe;
