import useIndividualModel from "./useIndividualModel";
import useDerivedStateWithModel from "./useDerivedStateWithModel";

const useDerivedState = <S = any>(initState: S | (() => S), callback: (state: S) => S, deps: any[]) => {
  const [ ,model, clonedModel, status] = useIndividualModel(initState);
  const [state] = useDerivedStateWithModel(model, callback, deps);
  return [state, model, clonedModel, status];
}

export default useDerivedState;
