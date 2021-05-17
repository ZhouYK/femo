import { gluerUniqueFlagKey, gluerUniqueFlagValue, development } from './constants';

import { HandleFunc, GluerReturn } from '../index';


const defaultReducer = (data: any, _state: any) => data;
const warning = 'highly recommend setting the initial state with the reducer：';
const getWarning = (rd: HandleFunc<any, any, any>) => `${warning}${rd.toString()}`;

/**
 * 节点生成函数
 * @returns {function(): {action: *, reducer: *, initState: *}}
 * @param fn
 */
function gluer<S = any, D = S, R = Partial<S>>(fn: HandleFunc<S, D, R>) : GluerReturn<S, R>;
function gluer<S, D, R = any>(initialState: S) : GluerReturn<S, R>;
function gluer<S = any, D = S, R = Partial<S>>(fn:  HandleFunc<S, D, R>, initialState: S) : GluerReturn<S, R>;
function gluer(...args: any[]) {
  const [rd, initialState] = args;
  // 默认生成action creator
  const actionCreator: ActionCreatorFn = (...params: any[]) => {
    if (process.env.NODE_ENV === development) {
      if (params.length === 0) {
        console.warn('you have dispatched an action whose data is undefined！');
      } else if (params.length > 1) {
        console.warn(`you have passed "${params}" into the action, only the first param is needed`);
      }
    }
    return params[0];
  };
  let reducerFnc: Reducer;
  let initState = initialState;
  // 没有传入任何参数则默认生成一个reducer
  if (args.length === 0) {
    // 默认值reducer
    reducerFnc = defaultReducer;
  } else if (args.length === 1) {
    // 会被当做初始值处理
    if (typeof rd !== 'function') {
      // 默认生成一个reducer
      reducerFnc = defaultReducer;
      // 初始值
      initState = rd;
    } else {
      reducerFnc = rd;
      if (process.env.NODE_ENV === development) {
        throw new Error(getWarning(rd));
      }
    }
  } else {
    if (typeof rd !== 'function') {
      throw new Error('first argument must be function');
    }
    reducerFnc = rd;
    if (process.env.NODE_ENV === development) {
      if (initialState === undefined) {
        throw new Error(getWarning(rd));
      }
    }
  }
  // 为了和最终的使用行为保持一致，所以返回一个普通函数
  const gf: any = () => ({
    reducer: reducerFnc,
    action: actionCreator,
    initState,
  });
  Object.defineProperty(gf, gluerUniqueFlagKey, {
    value: gluerUniqueFlagValue,
    writable: false,
    configurable: true,
    enumerable: true,
  });
  return gf;
}

export default gluer;
