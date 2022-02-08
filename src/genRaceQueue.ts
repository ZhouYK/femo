import {promiseDeprecated, promiseDeprecatedFromClonedModel} from './constants';
import {RacePromise, RaceQueueObj} from '../index';

export type ErrorFlag = typeof promiseDeprecated | typeof promiseDeprecatedFromClonedModel;


export const promiseDeprecatedError = 'the promise is deprecated by race condition';

const genRaceQueue = (deprecatedError?: ErrorFlag): RaceQueueObj => {
  const errorFlag = deprecatedError || promiseDeprecated;
  let raceQueue: RacePromise[] | null = [];

  return {
    push: (p: RacePromise, customerErrorFlag?: ErrorFlag ) => {
      if (!(p instanceof Promise)) {
        throw new Error('The race queue item should be Promise');
      }
      const flag = customerErrorFlag || errorFlag;
      if (raceQueue && raceQueue[0]) {
        raceQueue[0][flag] = true;
      }
      raceQueue?.splice(0);
      raceQueue?.push(p);
      return p;
    },

    clear: (customerErrorFlag?: ErrorFlag) => {
      const flag = customerErrorFlag || errorFlag;
      if (raceQueue && raceQueue[0]) {
        raceQueue[0][flag] = true;
      }
      raceQueue?.splice(0);
    },

    destroy: (customerErrorFlag?: ErrorFlag) => {
      const flag = customerErrorFlag || errorFlag;
      if (raceQueue && raceQueue[0]) {
        raceQueue[0][flag] = true;
      }
      raceQueue?.splice(0);
      raceQueue = null;
    },

    __UNSAFE__getQueue: () => raceQueue,
  };
}

export default genRaceQueue;
