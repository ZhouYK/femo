import useBatchDerivedStateToModel, {DerivedSpace} from "./useBatchDerivedStateToModel";
import useIndividualModel from "./useIndividualModel";
import {GluerReturn, ModelStatus} from "../../index";


const useBatchDerivedModel = <S, D extends DerivedSpace<S, any>[]>(initState: S | (() => S), ...derivedSpace: D): [S, GluerReturn<S>, ModelStatus] => {
  const [, model, status] = useIndividualModel(initState);
  const [state] = useBatchDerivedStateToModel(model, ...derivedSpace);
  return [state, model, status];
}

export default useBatchDerivedModel;
