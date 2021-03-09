import { useEffect, useState } from 'react';
import { GluerReturn } from "../../index";
import subscribe from "../subscribe";

const useModel = <T, D>(model: GluerReturn<T, D>, handleFnc?: (data: any) => any, resetWhenUnmount?: boolean): [T, (data: T) => void] => {
  const [state, updateState] = useState(() => {
    const tmpState = model();
    if (handleFnc) {
      return handleFnc(tmpState);
    }
    return tmpState;
  });

  useEffect(() => {
    const unsub = subscribe([model], (modelData: any) => {
      if (handleFnc) {
        updateState(handleFnc(modelData));
      } else {
        updateState(modelData);
      }
    });
    return () => {
      unsub();
      if (resetWhenUnmount) {
        model.reset();
      }
    };
  }, []);

  return [state, updateState];
};

export default useModel;
