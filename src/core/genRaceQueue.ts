import { RacePromise, RaceQueueObj } from '../../index';
import { isAsync, isPromise } from '../tools';
import {
  promiseDeprecated,
  promiseDeprecatedFromClonedModel,
  promiseDeprecatedFromLocalService,
  promiseDeprecatedFromLocalServicePure
} from './constants';

export type ErrorFlag = typeof promiseDeprecated | typeof promiseDeprecatedFromClonedModel | typeof promiseDeprecatedFromLocalService | typeof promiseDeprecatedFromLocalServicePure;
export const errorFlags = [promiseDeprecated, promiseDeprecatedFromClonedModel, promiseDeprecatedFromLocalService, promiseDeprecatedFromLocalServicePure];

export const promiseDeprecatedError = 'the promise is deprecated by race condition';
export const isRaceError = (error: any) =>  error === promiseDeprecatedError;

const genRaceQueue = (deprecatedError?: ErrorFlag): RaceQueueObj => {
  const errorFlag = deprecatedError || promiseDeprecated;
  let raceQueue: RacePromise[] | null = [];

  return {
    push: (p: RacePromise | any, customerErrorFlag?: ErrorFlag ) => {
      const flag = customerErrorFlag || errorFlag;
      // 不管什么策略 replace/merge 都打上标记
      // 只是在处理的地方区分就行了
      raceQueue?.forEach((t) => {
        if (isPromise(t)) {
          // @ts-ignore
          if (!errorFlags.some((ef) => t?.[ef])) {
            t[flag] = true;
          }
        }
      })
      // 如果现存的元素没有 promise，则清空
      if (
        !(raceQueue?.some((rqp) => {
          return isPromise(rqp);
        }))
      ) {
        raceQueue?.splice(0);
      }
      raceQueue?.push(p);
      return p;
    },

    clear: (customerErrorFlag?: ErrorFlag) => {
      const flag = customerErrorFlag || errorFlag;
      raceQueue?.forEach((rp) => {
        if (isAsync(rp)) {
          rp[flag] = true;
        }
      })
      raceQueue?.splice(0);
    },

    destroy: (customerErrorFlag?: ErrorFlag) => {
      const flag = customerErrorFlag || errorFlag;
      raceQueue?.forEach((rp) => {
        if (isAsync(rp)) {
          rp[flag] = true;
        }
      })
      raceQueue?.splice(0);
      raceQueue = null;
    },

    getIndex: (p: Promise<any>) => {
      return (raceQueue || [])?.indexOf(p);
    },

    slice: (...args: any[]) => {
      return (raceQueue || [])?.slice(...args)
    },

    replace: (...args: any[]) => {
      const [p, by] = args;
      const index = (raceQueue || [])?.indexOf(p);
      if (args.length === 1) {
        raceQueue?.splice(index, 1);
        return;
      }
      raceQueue?.splice(index, 1, by);
    },

    __UNSAFE__getQueue: () => raceQueue,
  };
}

export default genRaceQueue;
