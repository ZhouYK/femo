import {Callback, GluerReturn} from '../index';
import {gluerUniqueFlagKey, gluerUniqueFlagValue} from './constants';
import unsubscribe, { modelToCallbacksMap, callbackToModelsMap } from './unsubscribe';
import {isArray} from './tools';



const subscribe = (deps: GluerReturn<any>[], cb: Callback, callWhenSub = true) => {
  if (!isArray(deps)) {
    throw new Error(`Error: the first param must be array！${ deps }`);
  }

  // 每一个callback传进来都会被包装，所以可以保证每次订阅的callback都是唯一的
  const callback = (...args: any[]) => {
    return cb(...args);
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

  const setDeps = copyDeps.length !== 0;
  // 如果传入依赖为空数组，则不建立依赖。只会执行在初始化的时候执行一次回调。
  if (setDeps) {
    // 依赖与函数的映射
    const l = copyDeps.length;
    for (let i = 0; i < l; i += 1) {
      const dep = copyDeps[i];
      if (modelToCallbacksMap.has(dep)) {
        const set = modelToCallbacksMap.get(dep);
        set?.add(callback);
      } else {
        modelToCallbacksMap.set(dep, new Set([callback]))
      }
    }
    // 每次绑定都重新设置callback对应的依赖数组
    // 所以如果有两次或两次以上同一callback的设置，对应的model会以最后一次设置的model数组为准
    callbackToModelsMap.set(callback, new Set<GluerReturn<any>>(copyDeps));
  }

  // 映射建立完毕之后，初始化时，执行一次回调，注入初始值
  // 为什么是映射建立完之后再执行？因为需要引起更新，否则第一次初始化的时候无论如何都不会引起更新，这样行为就不一致
  if (callWhenSub) {
    callback(...initialDepsValue);
  }

  return () => {
    // 不等于0才去解除依赖
    if (setDeps) {
      unsubscribe(copyDeps, callback);
    }
  }
};

export default subscribe;
