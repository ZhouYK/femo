import useBatchDerivedStateToModel, {DerivedSpace} from './rareHooks/useBatchDerivedStateToModel';
import useModel from './useModel';
import { FemoModel, LoadingStatus } from '../../index';


const useBatchDerivedModel = <S , D extends DerivedSpace<S>[]>(initState: S | (() => S), ...derivedSpace: D): [S, FemoModel<S>, LoadingStatus] => {
  const [,  clonedModel, status] = useModel(initState);
  const [state] = useBatchDerivedStateToModel<S, D>(clonedModel, ...derivedSpace);
  const { service, ...rest } = status;
  return [state, clonedModel, rest];
}

export default useBatchDerivedModel;
