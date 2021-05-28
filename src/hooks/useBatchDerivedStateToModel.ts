import {GluerReturn} from "../../index";

interface DerivedWorkspace<S, T = any> {
  source: T;
  callback: (nextSource: T, prevSource: T, state: S) => S;
}

const useBatchDerivedStateToModel = <S = any>(model: GluerReturn<S>, ) => {

}
