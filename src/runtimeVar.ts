import {GluerReturn} from '../index';
import { promiseDeprecated, underOnChangeContext, underOnUpdateContext } from './constants';
import {ErrorFlag} from './genRaceQueue';

export type RacePromiseContext = typeof underOnChangeContext | typeof underOnUpdateContext | string;

const runtimeVar: {
  runtimePromiseDeprecatedFlag: ErrorFlag;
  runtimeDepsModelCollectedMap: Map<GluerReturn<any>, number>;
  runtimeRacePromiseContext: RacePromiseContext;
} = {
  runtimePromiseDeprecatedFlag: promiseDeprecated,
  runtimeDepsModelCollectedMap: new Map(),
  runtimeRacePromiseContext: '',
}

export default runtimeVar;
