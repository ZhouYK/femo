import {GluerReturn} from "../index";
import {gluerUniqueFlagKey, gluerUniqueFlagValue} from "./constants";

export const refToDepsMap = new Map();
export const depsToFnMap = new Map();

const subscribe = (deps: GluerReturn<any>[], callback: (...args: any[]) => void, callWhenSub = true) => {
  if (!(deps instanceof Array)) {
    throw new Error(`Error: the first param must be array！${ deps }`);
  }

  if (typeof callback !== 'function') {
    throw new Error(`Error: the second param muse be function! ${ callback }`);
  }

  // 需要保持外部引用
  // 和mutedDeps功能相关
  // 外部会议传入的依赖数组作为判断依据，所以在内部也需要和外部的数组引用保持一致
  const copyDeps = deps;
  const wrapCallback = () => {
    let cacheDepsValue = copyDeps.map(dep => {

      if (typeof dep !== 'function') {
        console.trace();
        throw new Error(`Error: dependency ${dep}, is not function.`);
      }
      // @ts-ignore
      if (dep[gluerUniqueFlagKey] !== gluerUniqueFlagValue) {
        console.error(`Warning: dependency ${dep}, is not defined by gluer. Please check it!`)
      }
      return (dep as (...args: any[]) => any)();
    });
    const handler = (...params: GluerReturn<any>[]) => {
      let flag = false;
      const res = params.map((dp, i) => {
        const value = dp();
        if (!Object.is(value, cacheDepsValue[i])) {
          flag = true;
        }
        return value
      });
      if (flag) {
        cacheDepsValue = res;
        callback(...res);
      }
    };
    return {
      handler,
      initialDepsValue: cacheDepsValue
    }
  };
  const initialBundle = wrapCallback();
  // 如果传入依赖为空数组，则不建立依赖。只会执行在初始化的时候执行一次回调。
  if (copyDeps.length !== 0) {
    // 依赖与函数的映射
    depsToFnMap.set(copyDeps, initialBundle.handler);
    // 模型节点与依赖的映射
    copyDeps.forEach(dep => {
      if (refToDepsMap.has(dep)) {
        const value = refToDepsMap.get(dep);
        (value as any[]).push(copyDeps);
      } else {
        refToDepsMap.set(dep, [copyDeps]);
      }
    });
  }

  // 映射建立完毕之后，初始化时，执行一次回调，注入初始值
  // 为什么是映射建立完之后再执行？因为需要引起更新，否则第一次初始化的时候无论如何都不会引起更新，这样行为就不一致
  if (callWhenSub) {
    callback(...initialBundle.initialDepsValue);
  }

  return function unsubscribe() {
    // 不等于0才去解除依赖
    if (copyDeps.length !== 0) {
      depsToFnMap.delete(copyDeps);
      refToDepsMap.forEach((value) => {
        for (let i = 0; i < value.length; i += 1) {
          if (value[i] === copyDeps) {
            value.splice(i, 1);
            break;
          }
        }
      });
    }
  }
};

export default subscribe;
