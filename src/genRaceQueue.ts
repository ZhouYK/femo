import {promiseDeprecated, promiseDeprecatedFromClonedModel, raceQueue as raceQueueKey} from "./constants";
import {RaceQueue} from "./interface";

const raceQueuePool = new Map();
export type ErrorFlag = typeof promiseDeprecated | typeof promiseDeprecatedFromClonedModel;

export type RacePromise = Promise<any> & {[raceQueueKey]?: RaceQueue ; [promiseDeprecated]?: boolean; [promiseDeprecatedFromClonedModel]?: boolean; };

export const promiseDeprecatedError = 'the promise is deprecated by race condition';

const genRaceQueue = (deprecatedError?: ErrorFlag) => {
  const errorFlag = deprecatedError || promiseDeprecated;
  let raceQueue: RacePromise[] | null = [];

  const obj = {
    push: (p: RacePromise, customerErrorFlag?: ErrorFlag ) => {
      if (!(p instanceof Promise)) {
        throw new Error("The race queue item should be Promise");
      }
      const flag = customerErrorFlag || errorFlag;
      if (raceQueue) {
        raceQueue.forEach((promise) => {
          if (!(flag in promise)) {
            promise[flag]  = true;
          }
        });
        raceQueue.splice(0);
        raceQueue.push(p);
      } else {
        console.warn('the race queue has been destroyed');
        return p;
      }

      // 如果已经属于一个异步队列了，则再加一个
      if (raceQueueKey in p) {
        const value = p[raceQueueKey];
        if (value && value.indexOf(raceQueue) === -1) {
          value.push(raceQueue);
        }
      } else {
        // 打标记
        Object.defineProperty(p, raceQueueKey, {
          value: [raceQueue],
          configurable: true, // 可删除
          writable: false,
          enumerable: true,
        });
      }
      return p;
    },

    clear: (customerErrorFlag?: ErrorFlag) => {
      if (raceQueue) {
        const flag = customerErrorFlag || errorFlag;
        raceQueue.forEach((rq) => {
          rq[flag] = true;
        });
        raceQueue.splice(0);
      }
    },

    destroy: (customerErrorFlag?: ErrorFlag) => {
      raceQueuePool.delete(obj);
      if (raceQueue) {
        const flag = customerErrorFlag || errorFlag;
        // 摧毁的时候，所有的promise都置为废弃状态
        raceQueue.forEach((rq) => {
          rq[flag] = true;
        });
        raceQueue.splice(0);
        raceQueue = null;
      }
    },

    __UNSAFE__getQueue: () => raceQueue,
  };
  raceQueuePool.set(obj, raceQueue);
  return obj;
}

export default genRaceQueue;
