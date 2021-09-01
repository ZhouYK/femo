import {GluerReturn} from "../index";
import {gluerUniqueFlagKey, gluerUniqueFlagValue} from "./constants";

export type Callback = (...args: any[]) => void;

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

const subscribe = (deps: GluerReturn<any>[], callback: Callback, callWhenSub = true) => {
  if (!(deps instanceof Array)) {
    throw new Error(`Error: the first param must be array！${ deps }`);
  }

  if (typeof callback !== 'function') {
    throw new Error(`Error: the second param muse be function! ${ callback }`);
  }

  // 需要保持外部引用
  // 和mutedDeps功能相关
  // 外部会以传入的依赖数组作为判断依据，所以在内部也需要和外部的数组引用保持一致
  const copyDeps = deps;
  const initialDepsValue: any[] = [];
  for (let i = 0; i < copyDeps.length; i += 1) {
    const dep = copyDeps[i];
    if (typeof dep !== 'function') {
      console.trace();
      throw new Error(`Error: dependency ${dep}, is not function.`);
    }
    // @ts-ignore
    if (dep[gluerUniqueFlagKey] !== gluerUniqueFlagValue) {
      console.error(`Warning: dependency ${dep}, is not defined by gluer. Please check it!`)
    }
    initialDepsValue.push((dep as (...args: any[]) => any)());
  };

  // 如果传入依赖为空数组，则不建立依赖。只会执行在初始化的时候执行一次回调。
  if (copyDeps.length !== 0) {
    // 依赖与函数的映射
    if (depsToFnMap.has(copyDeps)) {
      // 需要对传入的callback进行验重
      const result = depsToFnMap.get(copyDeps) as Callback[];
      // 如果是重复的，则只记录一次
      if (!result.includes(callback)) {
        result.push(callback);
      }
    } else {
      depsToFnMap.set(copyDeps, [callback])
    }

    // 模型节点与依赖的映射
    for (let i = 0; i < copyDeps.length; i += 1) {
      const dep = copyDeps[i];
      if (refToDepsMap.has(dep)) {
        const value = refToDepsMap.get(dep);
        // 如果是重复的，则只记录一次
        if ((value as any[]).indexOf(copyDeps) < 0) {
          (value as any[]).push(copyDeps);
        }
      } else {
        refToDepsMap.set(dep, [copyDeps]);
      }
    }
  }

  // 映射建立完毕之后，初始化时，执行一次回调，注入初始值
  // 为什么是映射建立完之后再执行？因为需要引起更新，否则第一次初始化的时候无论如何都不会引起更新，这样行为就不一致
  if (callWhenSub) {
    callback(...initialDepsValue);
  }

  return function unsubscribe() {
    // 不等于0才去解除依赖
    if (copyDeps.length !== 0) {
      const fns = depsToFnMap.get(copyDeps) as Callback[];
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
      depsToFnMap.delete(copyDeps);
      deleteDepsInRefToDepsMap(copyDeps);
    }
  }
};

export default subscribe;
