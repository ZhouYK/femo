import getType from './getType';

const isPlainObject = (target: any) => getType(target) === '[object Object]';
export default isPlainObject;
