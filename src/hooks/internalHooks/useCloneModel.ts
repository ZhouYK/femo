import {useEffect, useRef, useState} from "react";
import {GluerReturn, ModelStatus} from "../../../index";
import {defaultReducer, promiseDeprecatedError} from '../../gluer';
import {isAsync} from "../../tools";
import genRaceQueue from "../../genRaceQueue";

const useCloneModel = <T>(model: GluerReturn<T>, modelDeps: GluerReturn<any>[] = []): [GluerReturn<T>, ModelStatus] => {
  const unmountedFlagRef = useRef(false);
  const [status, updateStatus] = useState<ModelStatus>({
    loading: false,
  });
  // @ts-ignore
  const [clonedModel] = useState<GluerReturn<T>>(() => {
    const rq = genRaceQueue();
    const fn = (...args: any[]) => {

      if (args.length === 0) return model();
      // @ts-ignore
      const result = model.preTreat(...args);
      if (isAsync(result)) {
        const asyncResult = model(result, defaultReducer, modelDeps);
        updateStatus((prevState) => {
          return {
            ...prevState,
            loading: true,
          }
        });
        (asyncResult as Promise<any>).then(() => {
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
        })
        return asyncResult;
      }
      return model(result);
    };
    Object.keys(model).forEach((key) => {
      if (key === 'race') {
        // @ts-ignore
        fn.race = (...args: any[]) => rq.push(fn(...args));
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
