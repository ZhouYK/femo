import {GluerReturn} from '../index';
import {promiseDeprecated} from './constants';
import {ErrorFlag} from './genRaceQueue';

const runtimeVar: {
  runtimePromiseDeprecatedFlag: ErrorFlag;
  runtimeDepsModelCollectedMap: Map<GluerReturn<any>, number>;
} = {
  runtimePromiseDeprecatedFlag: promiseDeprecated,
  runtimeDepsModelCollectedMap: new Map(),
}

export default runtimeVar;
