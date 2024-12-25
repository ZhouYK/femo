import { GlueConfig, ServiceOptions } from '../../index';

export const promiseDeprecated = 'promiseDeprecated';
export const manualThrownError = 'manual thrown error';
export const promiseDeprecatedFromClonedModel = 'promiseDeprecatedFromClonedModel';
export const promiseTouchedByModel = Symbol('promiseTouchedByModel');
export const gluerUniqueFlagKey = Symbol('gluerUniqueFlagKey');
export const gluerUniqueFlagValue = Symbol('gluerUniqueFlagValue');
export const pureServiceKey = Symbol('pureService');
export const promiseDeprecatedFromLocalService = 'promiseDeprecatedFromLocalService';
export const promiseDeprecatedFromLocalServicePure = 'promiseDeprecatedFromLocalServicePure';
export const resolveCatchError = 'resolvePromiseCatchError';

export const underModelCallbackContext = 'underModelChangeContext';

export const defaultServiceOptions: ServiceOptions = {
  autoLoad: true,
};
export const GlueConflictPolicy: {
  [k: string]: GlueConfig['updatePolicy'];
} = {
  replace: 'replace',
  merge: 'merge',
}

export const defaultGlueConfig: GlueConfig = {
  updatePolicy: GlueConflictPolicy.replace,
}
