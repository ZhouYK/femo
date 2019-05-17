import { degrade } from './degrade';

/**
 * 解构glue对象，生成对应的reducer以及action的调用函数
 */
const destruct = (structure) => {
  degrade(structure);
};

export { default as gluer } from './gluer';
export { destruct };
export { default as hasModel } from './hasModel';
export { default as referToState } from './referToState';
export default destruct;
