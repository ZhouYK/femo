import useBatchDerivedStateToModel, {DerivedSpace} from "./useBatchDerivedStateToModel";
import useIndividualModel from "./useIndividualModel";


const useBatchDerivedModel = <S, D extends DerivedSpace<S, any>[]>(initState: S | (() => S), ...derivedSpace: D) => {
  const [, model] = useIndividualModel(initState);
  const [state] = useBatchDerivedStateToModel(model, ...derivedSpace);
  return [state, model];
}

export default useBatchDerivedModel;
