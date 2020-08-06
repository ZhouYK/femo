export const getType = (arg: any) => Object.prototype.toString.call(arg);
export const isPlainObject = (target: any) => getType(target) === '[object Object]';
export const isAsync = (target: any) => getType(target) === '[object AsyncFunction]' || getType(target) === '[object Promise]';
export const isArray = (target: any) => getType(target) === '[object Array]';
