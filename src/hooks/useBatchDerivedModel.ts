import useBatchDerivedStateToModel, {DerivedSpace} from './rareHooks/useBatchDerivedStateToModel';
import useModel from './useModel';
import { FemoModel, LoadingStatus } from '../../index';


const useBatchDerivedModel = <S , D extends DerivedSpace<S>[]>(initState: S | (() => S), ...derivedSpace: D): [S, FemoModel<S>, FemoModel<S>, LoadingStatus] => {
  const [, model, clonedModel, status] = useModel(initState);
  const [state] = useBatchDerivedStateToModel<S, D>(model, ...derivedSpace);
  const { service, ...rest } = status;
  return [state, model, clonedModel, rest];
}

export default useBatchDerivedModel;
