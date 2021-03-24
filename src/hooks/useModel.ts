import { useEffect, useState } from 'react';
import { GluerReturn } from "../../index";
import subscribe from "../subscribe";

/**
 * 将外部model注入到组件内部的自定义钩子函数，model生命周期不跟随组件，是共享数据
 * 区别于useIndividualModel
 * @param model 数据节点函数
 * @param handleFnc 返回state前可处理state的钩子函数
 * @param resetWhenUnmount 是否在组件卸载的时候，重置model的数据
 */
const useModel = <T = any, D = any>(model: GluerReturn<T, D>, handleFnc?: (data: any) => any, resetWhenUnmount?: boolean): [T, (data: T) => void] => {
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
