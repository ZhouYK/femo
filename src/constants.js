export const uniqueTypeConnect = '.';
export const gluerUniqueFlagValue = Symbol('gluerUniqueFlagValue');
export const gluerUniqueFlagKey = Symbol('gluerUniqueFlagKey');
export const syncActionFnFlag = Symbol('syncActionFnFlag');
export const syncActionFnFlagValue = Symbol('syncActionFnFlagValue');
export const defaultValueKey = Symbol('____initialDefaultValue____');
export const glueStatePrefix = `state${uniqueTypeConnect}`;
export const actionType = 'actionType';
export const development = 'development';
export const reducerInAction = Symbol('reducerInAction');
export const globalState = Symbol('globalState');
export const referencesMap = Symbol('referencesMap');

export default {
  uniqueTypeConnect,
  gluerUniqueFlagValue,
  gluerUniqueFlagKey,
  defaultValueKey,
  syncActionFnFlag,
  syncActionFnFlagValue,
  actionType,
  glueStatePrefix,
  development,
  reducerInAction,
  globalState,
  referencesMap
};
