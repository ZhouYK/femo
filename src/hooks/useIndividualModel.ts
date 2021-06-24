import {useEffect, useState} from "react";
import gluer from "../gluer";
import subscribe from "../subscribe";
import {GluerReturn, ModelStatus} from "../../index";
import useCloneModel from "./internalHooks/useCloneModel";

/**
 * model的生命周期跟随组件，相当于一个内部state
 * 区别于useModel
 * 不要尝试去订阅返回的clonedModel，不会有效果，因为它只是对真正的model的一层包装。需要监听的话，应该是内部真正的model。
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
