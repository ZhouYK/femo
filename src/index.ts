/**
 * @deprecated please use glue instead
 */
export { default as gluer } from './core/glue';
export { default as glue } from './core/glue';
export { default as subscribe } from './core/subscribe';
export { default as unsubscribe } from './core/unsubscribe';
export { default as genRaceQueue, promiseDeprecatedError, isRaceError } from './core/genRaceQueue';
export { default as genRegister } from './core/register';
export { default as useModel } from './hooks/useModel';
/**
 * @deprecated 请使用 useModel 代替
 */
export { default as useIndividualModel } from './hooks/useIndividualModel';
export { default as useDerivedStateToModel } from './hooks/rareHooks/useDerivedStateToModel';
export { default as useDerivedModel } from './hooks/useDerivedModel';
export { default as useBatchDerivedStateToModel } from './hooks/rareHooks/useBatchDerivedStateToModel';
export { default as useBatchDerivedModel } from './hooks/useBatchDerivedModel';
export { default as useDerivedState } from './hooks/useDerivedState';
export { default as useDerivedStateWithModel } from './hooks/rareHooks/useDerivedStateWithModel';
export { default as useSubscribe } from './hooks/rareHooks/useSubscribe';
export { default as useException } from './hooks/rareHooks/useException';
export { default as useLocalService } from './hooks/useLocalService';
/**
 * @deprecated please use useUpdateEffect instead
 */
export { default as useLight } from './hooks/useUpdateEffect';
/**
 * @deprecated please use useUpdateEffect instead
 */
export { default as useSkipOnce } from './hooks/useUpdateEffect';

export { default as useUpdateEffect } from './hooks/useUpdateEffect';
export { default as Inject } from './hoc/Inject';
export { default as runtimeVar } from './core/runtimeVar';
