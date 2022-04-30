import useBatchDerivedStateToModel, {DerivedSpace} from './rareHooks/useBatchDerivedStateToModel';
import useIndividualModel from './useIndividualModel';
import {GluerReturn, ModelStatus} from '../../index';


const useBatchDerivedModel = <S, D extends DerivedSpace<S, any>[]>(initState: S | (() => S), ...derivedSpace: D): [S, GluerReturn<S>, GluerReturn<S>, ModelStatus] => {
  const [, model, clonedModel, status] = useIndividualModel(initState);
  const [state] = useBatchDerivedStateToModel(model, ...derivedSpace);
  return [state, model, clonedModel, status];
}

export default useBatchDerivedModel;
