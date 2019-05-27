import { degrade } from './degrade';

/**
 * 解构glue对象，生成对应的reducer以及action的调用函数
 */
const femo = <T>(structure: T, helpers: any[] = []) => degrade(structure, helpers);

export { default as gluer } from './gluer';
export default femo;
