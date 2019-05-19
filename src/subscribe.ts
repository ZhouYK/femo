import { referenceToDepsMap, depsToCallbackMap, model as femoModel } from "./constants";
// @ts-ignore
const subscribe = (femo, reToStateFn) => {
  const refToDepsMap = femo[referenceToDepsMap];
  const depsToFnMap = femo[depsToCallbackMap];
  // @ts-ignore
  // eslint-disable-next-line consistent-return
  return (...args: any[]) => {
    // @ts-ignore
    let callback;
    // @ts-ignore
    let copyDeps;
    if (args.length === 0) {
      throw new Error(`Error: please input some params in subscribe function!`)
    } else if (args.length === 1) {
      if (typeof args[0] !== 'function') {
        throw new Error(`Error: the only param must be function! ${args[0]}`)
      }
      // 没有写明依赖，只穿了一个函数
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
      // @ts-ignore
      let cacheDepsValue = copyDeps.map(dep => {
        return reToStateFn(dep);
      });
      // @ts-ignore
      return (...params) => {
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
          // @ts-ignore
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
        // @ts-ignore
        value.push(copyDeps);
      } else {
        // @ts-ignore
        refToDepsMap.set(dep, [copyDeps]);
      }
    });
    return function unsubscribe() {
      // @ts-ignore
      depsToFnMap.delete(copyDeps);
      // @ts-ignore
      refToDepsMap.forEach((value) => {
        for (let i = 0; i < value.length; i += 1) {
          // @ts-ignore
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
