import {
  rootNodeMapKey,
  uniqueTypeConnect,
  referencesMap,
  globalState
} from './constants';
import { InnerFemo } from "./glueAction";

export interface ReferToState {
  (femo: InnerFemo): (model: any) => any;
}

const referToState: ReferToState = (femo: InnerFemo) => (model: any) => {
  const map = femo[referencesMap];
  if (!map.has(model)) {
    return undefined;
  }
  const pathStr = map.get(model);
  const currentState = femo[globalState];
  // 返回整个state
  if (pathStr === rootNodeMapKey) {
    return currentState;
  }
  const keys = (pathStr as string).split(uniqueTypeConnect);
  return keys.reduce((pre, cur) => {
    try {
      return pre[cur];
    } catch (e) {
      return pre;
    }
  }, currentState);
};

export default referToState;