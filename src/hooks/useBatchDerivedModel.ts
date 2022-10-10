import useBatchDerivedStateToModel, {DerivedSpace} from './rareHooks/useBatchDerivedStateToModel';
import useIndividualModel from './useIndividualModel';
import { GluerReturn, LoadingStatus } from '../../index';


const useBatchDerivedModel = <S, D extends DerivedSpace<S, any>[]>(initState: S | (() => S), ...derivedSpace: D): [S, GluerReturn<S>, GluerReturn<S>, LoadingStatus] => {
  const [, model, clonedModel, status] = useIndividualModel(initState);
  const [state] = useBatchDerivedStateToModel(model, ...derivedSpace);
  const { service, ...rest } = status;
  return [state, model, clonedModel, rest];
}

export default useBatchDerivedModel;
