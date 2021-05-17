import { degrade } from './degrade';

/**
 * 解构glue对象，生成对应的reducer以及action的调用函数
 */
const femo = <T>(structure: T) => degrade(structure);

export { default as gluer } from './gluer';
export { promiseDeprecatedError } from './glueAction';
export default femo;
