import { HandleFunc } from '../index';
import {promiseTouchedByModel, gluerUniqueFlagKey, gluerUniqueFlagValue} from './core/constants';
import runtimeVar from './core/runtimeVar';

export const getType = (arg: any) => Object.prototype.toString.call(arg);
export const isPlainObject = (target: any) => getType(target) === '[object Object]';
export const isAsync = (target: any) => getType(target) === '[object AsyncFunction]' || getType(target) === '[object Promise]';
export const isArray = (target: any) => getType(target) === '[object Array]';

export const tagPromise = (p: Promise<any>) => {
  Object.defineProperty(p, promiseTouchedByModel, {
    value: true,
    writable: false,
    configurable: false,
    enumerable: false,
  });
};

export const isTagged = (p: Promise<any>) => {
  // @ts-ignore
  return p[promiseTouchedByModel];
}

export const isModel = (model: any) => {
  if (!model) return false;
  return model[gluerUniqueFlagKey] === gluerUniqueFlagValue;
}

export const composeReducer = <S, D, >(...args: HandleFunc<S, D, any>[]) => {
  if (args.length === 0) {
    throw new Error('composeReducer needs at least 1 param, but got 0');
  }
  return args.reduce((pre, cur, currentIndex) => {
    if (!currentIndex) {
      return pre;
    }
    return (state: S, data: D) => {
      const beforeState = pre(state, data);
      if (isAsync(beforeState)) {
        const { runtimeFromDerived} = runtimeVar;
        return beforeState.then((s: S) => {
          runtimeVar.runtimeFromDerived = runtimeFromDerived;
          return cur(s, data);
        })
      }
      return cur(beforeState, data);
    }
  }, args[0]);
}
