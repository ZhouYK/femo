import {useEffect, useRef, useState} from "react";
import {GluerReturn, ModelStatus} from "../../../index";
import { promiseDeprecatedError, defaultReducer} from '../../gluer';
import {isAsync} from "../../tools";

/**
 *
 * @param model
 * @param modelDeps 用于减少一次组件rerender，因为异步获取状态变更时会去更新loading，所以当loading变更时静默掉订阅的回调。clonedModel中所有异步更新都应该加上这个
 */
const useCloneModel = <T>(model: GluerReturn<T>, modelDeps: GluerReturn<any>[][] = []): [GluerReturn<T>, ModelStatus] => {
  const unmountedFlagRef = useRef(false);
  const [status, updateStatus] = useState<ModelStatus>({
    loading: false,
  });
  // @ts-ignore
  const [clonedModel] = useState<GluerReturn<T>>(() => {

    const statusHandleFn = (p: Promise<any>) => {
      updateStatus((prevState) => {
        return {
          ...prevState,
          loading: true,
        }
      });
      p.then(() => {
        if (unmountedFlagRef.current) return;
        updateStatus((prevState) => {
          return {
            ...prevState,
            loading: false,
          }
        });
      }).catch((err) => {
        if (unmountedFlagRef.current) return;
        if (err !== promiseDeprecatedError) {
          updateStatus((prevState) => {
            return {
              ...prevState,
              loading: false,
            }
          });
        }
      });
      return p;
    };

    // ModelMethod<T>
    const fn = (...args: any[]) => {
      // @ts-ignore
      const res = model.preTreat(...args);
      // 只有异步数据才会传入modelDeps
      if (isAsync(res)) {
        // 目前最多三个参数
        // 如果第三个参数手动传了，以手动为准
        // 没传，以传入的modelDeps为准
        return statusHandleFn(model(res, defaultReducer, args[2] || modelDeps) as Promise<T>);
      }
      return model(res);
    };

    Object.keys(model).forEach((key) => {
      // 需要对异步数据做单独处理，因为要加上异步状态的追踪
      if (key === 'race') {
        // @ts-ignore
        fn.race = (...args: any[]) => {
          // @ts-ignore
          const r = model.preTreat(...args);
          return statusHandleFn(model.race(r, defaultReducer, args[2] || modelDeps));
        };
      } else if (key === 'cache') {
        // 理由同 race
        // @ts-ignore
        fn.cache = (...args: any[]) => {
          if (args.length === 0) return model.cache();
          // @ts-ignore
          const r = model.preTreat(...args);
          return statusHandleFn(model.cache(r, defaultReducer, args[2] || modelDeps));
        };
      } else {
        // @ts-ignore
        fn[key] = (...args: any[]) => model[key](...args);
      }
    });
    return fn;
  });

  useEffect(() => () => {
    unmountedFlagRef.current = true;
  }, []);

  return [clonedModel, status];
}

export default useCloneModel;
