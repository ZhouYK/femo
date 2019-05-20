import { referenceToDepsMap, depsToCallbackMap, model as femoModel } from "./constants";
import { InnerFemo } from "./glueAction";
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
      return (...params: any[]) => {
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
      }
    };
    // 依赖与函数的映射
    depsToFnMap.set(copyDeps, wrapCallback());
    // 模型节点与依赖的映射
    copyDeps.forEach(dep => {
      if (refToDepsMap.has(dep)) {
        const value = refToDepsMap.get(dep);
        (value as any[]).push(copyDeps);
      } else {
        refToDepsMap.set(dep, [copyDeps]);
      }
    });
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
