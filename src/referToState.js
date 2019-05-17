import { uniqueTypeConnect, referencesMap, globalState } from './constants';

const referToState = (femo) => (model) => {
  const map = femo[referencesMap];
  if (!map.has(model)) {
    return undefined;
  }
  const pathStr = map.get(model);
  const currentState = femo[globalState];
  // 返回整个state
  if (pathStr === '') {
    return currentState;
  }
  const keys = pathStr.split(uniqueTypeConnect);
  return keys.reduce((pre, cur) => {
    try {
      return pre[cur];
    } catch (e) {
      return pre;
    }
  }, currentState);
};

export default referToState;
