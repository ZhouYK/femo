import useModel from './useModel';
import useDerivedStateWithModel from './rareHooks/useDerivedStateWithModel';

/**
 *
 * @param args
 */
const useDerivedState = (...args: any[])=> {
  const { length } = args;
  let [initState, callback, deps] = args;
  if (length === 2) {
    [callback, deps] = args;
    // useIndividualModel能区分对待函数或者直接量来进行初始化
    initState = callback;
  }
  const [ ,model, clonedModel, status] = useModel(initState);
  const { service, ...rest } = status;
  const [state] = useDerivedStateWithModel(model, callback, deps, false, true);
  return [state, model, clonedModel, rest];
}

export default useDerivedState;
