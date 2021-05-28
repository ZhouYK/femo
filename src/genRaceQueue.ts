import {promiseDeprecated, raceQueue as raceQueueKey} from "./constants";
import {RaceQueue} from "./interface";

const raceQueuePool = new Map();

const genRaceQueue = () => {

  let raceQueue: (Promise<any> & { [promiseDeprecated]?: boolean })[] | null = [];

  const obj = {
    push: (p: Promise<any> & { [raceQueueKey]?: RaceQueue } ) => {
      if (!(p instanceof Promise)) {
        throw new Error("The race queue item should be Promise");
      }
      if (raceQueue) {
        raceQueue.forEach((promise) => {
          if (!(promiseDeprecated in promise)) {
            promise[promiseDeprecated]  = true;
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

    clear: () => {
      if (raceQueue) {
        raceQueue.forEach((rq) => {
          rq[promiseDeprecated] = true;
        });
        raceQueue.splice(0);
      }
    },

    destroy: () => {
      raceQueuePool.delete(obj);
      if (raceQueue) {
        // 摧毁的时候，所有的promise都置为废弃状态
        raceQueue.forEach((rq) => {
          rq[promiseDeprecated] = true;
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
