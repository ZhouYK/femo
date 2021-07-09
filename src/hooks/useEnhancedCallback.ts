import {useCallback, DependencyList, useRef} from "react";
import {useDerivedModel} from "../index";
import {EnhancedCallback, GluerReturn} from "../../index";

/**
 * 和useCallback唯一的区别是：为函数做了一层包装，可以让函数在依赖不变的情况下更新自己
 * @param callback
 * @param deps
 */
const useEnhancedCallback = <T extends (...args: any) => any>(callback: T, deps: DependencyList) => {
  const resultFn = useCallback(callback, deps);
  const modelRef = useRef<GluerReturn<EnhancedCallback<T>>>(null);
  const genNewFn = useCallback((f: T) => {
    const internalFn = (...args: any[]) => f(...args);
    internalFn.updateSelf = () => {
      (modelRef.current as GluerReturn<EnhancedCallback<T>>)(() => (...args: any[]) => f(...args));
    };
    return internalFn;
  }, []);

  const [fn, fnModel] = useDerivedModel(() => {
    return genNewFn(resultFn);
  }, resultFn, (ns, ps, s) => {
    if (!Object.is(ns, ps)) {
      return genNewFn(ns);
    }
    return s;
  });

  if (!modelRef.current) {
    // @ts-ignore
    modelRef.current = fnModel;
  }

  return fn;
}



export default useEnhancedCallback;
