import {useCallback, DependencyList} from "react";
import {useDerivedModel} from "../index";
import {EnhancedCallback, GluerReturn} from "../../index";

/**
 * 和useCallback唯一的区别是：为函数做了一层包装，可以让函数在依赖不变的情况下更新自己
 * @param callback
 * @param deps
 */
const useEnhancedCallback = <T extends (...args: any) => any>(callback: T, deps: DependencyList) => {
  const resultFn = useCallback(callback, deps);
  const genNewFn = useCallback((f: T, model: GluerReturn<EnhancedCallback<T>>) => {
    const internalFn = (...args: any[]) => f(...args);
    internalFn.updateSelf = () => {
      model(() => (...args: any[]) => f(...args));
    };
    return internalFn;
  }, []);

  const [fn, fnModel] = useDerivedModel(() => {
    // @ts-ignore
    const f = genNewFn(resultFn, fnModel)
    return f;
  }, resultFn, (ns, ps, s) => {
    if (!Object.is(ns, ps)) {
      // @ts-ignore
      const f = genNewFn(ns, fnModel);
      return f;
    }
    return s;
  });
  return fn;
}

export default useEnhancedCallback;
