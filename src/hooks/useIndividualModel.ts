import {useEffect, useState} from "react";
import gluer from "../gluer";
import subscribe from "../subscribe";
import {GluerReturn, ModelStatus} from "../../index";
import useCloneModel from "./internalHooks/useCloneModel";

/**
 * model的生命周期跟随组件，相当于一个内部state
 * 区别于useModel
 * @param initState
 */
const useIndividualModel = <S>(initState: S | (() => S)): [S, GluerReturn<S>, ModelStatus] => {
  const [model] = useState(() => {
    if (typeof initState === 'function') {
      return gluer((initState as () => S)());
    }
    return gluer(initState);
  });
  const [state, updateState] = useState(() => {
    return model();
  });

  const [clonedModel, status] = useCloneModel(model);

  useEffect(() => subscribe([model], (data) => {
    updateState(data);
  }), []);

  return [state, clonedModel, status];
}

export default useIndividualModel;
