import useIndividualModel from "./useIndividualModel";
import useDerivedStateWithModel from "./useDerivedStateWithModel";

/**
 *
 * @param initState S | (() => S)，可能没有
 * @param callback (state: S) => S， 如果没有initState，callback的返回值将用来初始化
 * @param deps any[]
 */
const useDerivedState = (...args: any[]) => {
  const { length } = args;
  let [initState, callback, deps] = args;
  if (length === 2) {
    [callback, deps] = args;
    // useIndividualModel能区分对待函数或者直接量来进行初始化
    initState = callback;
  }
  const [ ,model, clonedModel, status] = useIndividualModel(initState);
  const [state] = useDerivedStateWithModel(model, callback, deps, false);
  return [state, model, clonedModel, status];
}

export default useDerivedState;
