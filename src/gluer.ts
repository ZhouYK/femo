import api from './funcs/api';
import {
  basicLogic,
  handleArgs,
  initContext,
} from './funcs/basic';
import {
  // development,
  gluerUniqueFlagKey,
  gluerUniqueFlagValue,
} from './constants';

import {HandleFunc, GluerReturn} from '../index';

/**
 * 节点生成函数
 * @returns {function(): {action: *, reducer: *, initState: *}}
 * @param fn
 */
function gluer<S, D = any, R = S>(fn: HandleFunc<S, D, R>) : GluerReturn<S>;
function gluer<S, D = any>(initialState: S) : GluerReturn<S>;
function gluer<S, D = any, R = S>(fn:  HandleFunc<S, D, R>, initialState: S) : GluerReturn<S>;
function gluer(...args: any[]) {

  // context集中处理运行时的属性
  let context = initContext();
  // api则是方法集合
  handleArgs.apply(context, args);

  const tmpCxt: any = {};
  const fn: any = basicLogic(false).bind(tmpCxt);

  tmpCxt.fn = fn;
  context.fn = fn;
  context.selfDeps = [fn];
  // 合并过后context只在上面的bind里面有用了
  Object.assign(fn, context, api);
  // 合并完成后，清除context
  context = null;

  Object.defineProperty(fn, gluerUniqueFlagKey, {
    value: gluerUniqueFlagValue,
    writable: false,
    configurable: true,
    enumerable: true,
  });

  return fn;
}

export default gluer;
