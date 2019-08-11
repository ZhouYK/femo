import { referenceToDepsMap, depsToCallbackMap, model as femoModel } from "./constants";
import { InnerFemo } from "./interface";
import { ReferToState } from './referToState';

const subscribe = (femo: InnerFemo, reToStateFn: ReferToState) => {
  const refToDepsMap = femo[referenceToDepsMap];
  const depsToFnMap = femo[depsToCallbackMap];
  return (...args: any[]) => {
    let callback: (...p: any[]) => void;
    let copyDeps: any[];
    if (args.length === 0) {
      throw new Error(`Error: please input some params in subscribe function!`)
    } else if (args.length === 1) {
      if (typeof args[0] !== 'function') {
        throw new Error(`Error: the only param must be function! ${args[0]}`)
      }
      // 没有写明依赖，只传了一个函数
      // 默认依赖整个state
      [callback] = args;
      copyDeps = [femo[femoModel]];
    } else {
      let deps;
      [deps,callback] = args;
      if (!(deps instanceof Array)) {
        throw new Error(`Error: the first param must be an array！${ deps }`);
      }
      copyDeps = deps.length === 0 ? [femo[femoModel]] : [...deps];
    }
    const wrapCallback = () => {
      let cacheDepsValue = copyDeps.map(dep => {
        return reToStateFn(dep);
      });
      const handler = (...params: any[]) => {
          let flag = false;
          const res = params.map((dp, i) => {
              const value = reToStateFn(dp);
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

    // 映射建立完毕之后，初始化时，执行一次回调，注入初始值
    // 为什么是映射建立完之后再执行？因为需要引起更新，否则第一次初始化的时候无论如何都不会引起更新，这样行为就不一致
    callback(...initialBundle.initialDepsValue);

    return function unsubscribe() {
      depsToFnMap.delete(copyDeps);
      refToDepsMap.forEach((value) => {
        for (let i = 0; i < value.length; i += 1) {
          if (value[i] === copyDeps) {
            value.splice(1, i);
            break;
          }
        }
      });
    }
  }
};

export default subscribe;
