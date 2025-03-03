import useModel from './useModel';
import useDerivedStateToModel from './rareHooks/useDerivedStateToModel';
import { FemoModel, LoadingStatus } from '../../index';

/**
 * 在实际运用中发现，如果要使用useDerivedStateToModel，经常会先用useIndividualModel创建一个model。索性就把二者合成一个，方便使用
 * @param initState
 * @param source
 * @param callback
 */
const useDerivedModel = <S = any, P = any>(initState: S | (() => S), source: P, callback: (nextSource: P, prevSource: P, state: S) => S ): [S, FemoModel<S>, LoadingStatus] => {
  const [ , clonedModel, status] = useModel(initState);
  const [state] = useDerivedStateToModel(source, clonedModel, callback);
  const { service, ...rest } = status;

  return [state, clonedModel, rest];
}

export default useDerivedModel;
