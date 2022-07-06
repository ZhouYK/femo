import { BindType, GluerReturn, ListenType, RacePromise } from '../index';
import { promiseDeprecated, underModelCallbackContext } from './constants';
import {ErrorFlag} from './genRaceQueue';

export type RacePromiseContext = typeof underModelCallbackContext | string;

export interface RuntimeUpdateOrigin {
  updateType: 1; // 1 代表通过 useModel 更新（目前只有 useModel 才允许 service 更新）; 其他代表直接通过 model 更新；
  callbackIds: number[]; // 回调函数的唯一标识（ onUpdate、onChange、subscribe 注册的 callback 的 id）
  useModelId: number; // 每一次使用 useModel 都会产生一个唯一的 id
}

const runtimeVar: {
  runtimePromiseDeprecatedFlag: ErrorFlag;
  runtimeDepsModelCollectedMap: Map<GluerReturn<any>, number>;
  runtimeRacePromiseContext: RacePromiseContext;
  runtimeUpdateOrigin: RuntimeUpdateOrigin | null;
  runtimeBindType: BindType;
  runtimeListenType: ListenType;
  runtimeRacePromisesCollectedSet: Set<RacePromise> | null;
} = {
  runtimePromiseDeprecatedFlag: promiseDeprecated,
  runtimeDepsModelCollectedMap: new Map(),
  runtimeRacePromiseContext: '',
  runtimeUpdateOrigin: null,
  runtimeBindType: 0,
  runtimeListenType: 0,
  runtimeRacePromisesCollectedSet: null
}

export default runtimeVar;
