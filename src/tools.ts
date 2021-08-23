import {promiseTouchedByModel} from "./constants";

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
