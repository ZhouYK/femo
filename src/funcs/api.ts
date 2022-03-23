import { GluerReturn } from '../../index';
import runtimeVar from '../runtimeVar';
import subscribe from '../subscribe';
import { isArray } from '../tools';
import unsubscribe from '../unsubscribe';
import { basicLogic, GluerInstanceContext, historyGoUpdateFn, preTreat } from './basic';

const silent = basicLogic;

const pt = preTreat;

const reset = function <S = any>(this: GluerReturn<S> & GluerInstanceContext) {
  this(this.initState);
}

const relyOn = function (this: GluerInstanceContext, models: GluerReturn<any>[], callback: (data: any[], state: any) => any) {
  if (!isArray(models) || models.length === 0) {
    throw new Error('dependencies should be Array, ant not empty');
  }

  const { unsubscribeRelyArr, fn } = this;
  const unsub = subscribe(models, (...data: any[]) => {
    // 如果当前fn已经出现在调用链中，则不执行回调，因为回调中很可能有副作用
    if (runtimeVar.runtimeDepsModelCollectedMap.has(fn)) return;
    fn(() => callback(data, fn()));
  }, false);
  unsubscribeRelyArr.push(unsub);
  return unsub;
}

const relyOff = function (this: GluerInstanceContext, targetDeps?: GluerReturn<any>[]) {
  const { unsubscribeRelyArr } = this;
  // 没有传值，则认为是删除节点的全部依赖订阅
  if (targetDeps === undefined) {
    for (let i = 0; i < unsubscribeRelyArr.length; i += 1) {
      const f = unsubscribeRelyArr[i];
      f();
    }
    this.unsubscribeRelyArr = [];
  } else {
    unsubscribe(targetDeps);
  }
}


const onChange = function (this: GluerInstanceContext, callback: (state: any) => void) {
  if (typeof callback !== 'function') {
    throw new Error('callback should be function');
  }
  return subscribe(this.selfDeps, callback, false);
}

const offChange = function (this: GluerInstanceContext, callback?: (state: any) => void) {
  unsubscribe(this.selfDeps, callback);
}

const track = function (this: GluerInstanceContext) {
  const { trackArr, gluerState } = this;
  if (!trackArr.length) {
    trackArr.push(gluerState);
    this.curIndex = 0;
  }
}

const flush = function (this: GluerInstanceContext) {
  const { trackArr } = this;
  if (trackArr.length) {
    trackArr.splice(0);
    this.curIndex = 0;
  }
}

const go = function (this: GluerReturn<any> & GluerInstanceContext, step: number){
  const { gluerState } = this;
  // 如果在model的调用链中出现过，则中断循环更新，不再执行
  if (runtimeVar.runtimeDepsModelCollectedMap.has(this)) return gluerState;
  runtimeVar.runtimeDepsModelCollectedMap.set(this, 0);
  historyGoUpdateFn.call(this, step);
  // 删掉自己
  runtimeVar.runtimeDepsModelCollectedMap.delete(this);
  return this.gluerState;
}

const race = function (this: GluerInstanceContext & GluerReturn<any>, ...as: any[]) {
  // @ts-ignore
  return this.rq.push(this(...as), runtimeVar.runtimePromiseDeprecatedFlag)
}

const cache = function (this: GluerInstanceContext & GluerReturn<any>, ...as: any[]){
  const {  cachedData, cachedFlag } = this;
  if (as.length === 0) {
    return cachedData;
  }
  // 利用js是单线程执行，可设置运行时的状态变量，来给在运行时定义和调用的函数传参
  this.fromCache = true;
  let result;
  if (cachedFlag) {
    result = this.race(() => Promise.resolve(cachedData));
  } else {
    // @ts-ignore
    result = this.race(...as);
  }

  this.fromCache = false;
  return result;
}

const cacheClean = function (this: GluerInstanceContext) {
  this.cachedFlag = false;
  this.cachedData = undefined;
};

const o = {
  silent: silent(true),
  preTreat: pt,
  reset,
  relyOn,
  /**
   * 请使用relyOff
   * @deprecated
   */
  off: relyOff,
  relyOff,
  onChange,
  offChange,
  track,
  flush,
  go,
  race,
  cache,
  cacheClean,
}

// clonedModel不需要cache和race方法
export const clonedModelNeededKeys: string[] = Object.keys(o).filter((k) => k !== 'cache' && k !== 'race');

export default o;
