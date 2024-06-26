import { useCallback, useEffect, useRef } from 'react';
import { FemoModel, LocalService, LocalServiceHasStatus, RaceFn, Service, ServiceOptions } from '../../../index';
import {
  promiseDeprecatedFromLocalService,
  promiseDeprecatedFromLocalServicePure,
  pureServiceKey
} from '../../core/constants';
import { isAsync, isModel } from '../../tools';
import { runtimePromiseDeprecatedVarAssignment } from './useCloneModel';

type CustomerPromise<T = any> = { success?: boolean; data?: T; }  & Promise<T>;


const cache: Map<string, CustomerPromise> = new Map();
const cacheDeps: Map<string, any[] | undefined> = new Map();

const depsDifferent = (source: any[] = [], target: any[] = []) => {
  if ((source ?? []).length !== (target ?? []).length) return true;
  const l = source?.length ?? 0;
  for (let i = 0; i < l; i += 1) {
    if (!Object.is(source[i], target[i])) {
      return true;
    }
  }
  return false;
}

const getDifferentIndex = (source: any[] = [], target: any[] = []) => {
  const sl = source.length;
  const tl = target.length;
  const max = Math.max(sl, tl);
  const min = Math.min(sl, tl);
  const res = [];
  let i = 0
  for (; i < min; i += 1) {
    if (!Object.is(source[i], target[i])) {
      res.push(i);
    }
  }
  for (; i < max; i += 1) {
    res.push(i);
  }
  return res;
}

const useService = <T, D>(model: FemoModel<T>, clonedModel: FemoModel<T>, service?: Service<T, D>, deps?: any[], options?: ServiceOptions): [LocalService<T, D>] => {
  const { suspenseKey, suspense, control, autoLoad, } = options || {};
  const susKey = suspenseKey || suspense?.key;
  const depsRef = useRef<any[] | undefined>(deps);
  const serviceRef = useRef(service);
  serviceRef.current = service;
  const clonedModelRef = useRef(clonedModel);
  clonedModelRef.current = clonedModel;
  const modelRef = useRef(model);
  modelRef.current = model;

  // 只更新 state，不改变 loading、successful、error 等异步状态
  const localServicePure = useCallback<LocalServiceHasStatus<T>>((data) => {
    const state = modelRef.current();
    // 如果没有传入 service 说明不应该由途径去更新 model，这就应该直接返回。为了和 race 的返回保持一致，所以这里就返回了一个 promise。并且由于没有走
    // model 的更新，所以不用担心异步竞争的问题
    if (!serviceRef.current) return Promise.resolve(state);
    const r = serviceRef.current?.(state, data);
    return runtimePromiseDeprecatedVarAssignment(() => modelRef.current.race(r), promiseDeprecatedFromLocalServicePure)
  }, []);

  // 更新 state，且异步更新会改变 loading、successful、error 等异步状态
  const localServiceHasStatus = useCallback<LocalServiceHasStatus<T>>((data) => {
    const state = clonedModelRef.current();
    // 同上
    if (!serviceRef.current) return Promise.resolve(state);
    const r = serviceRef.current?.(state, data);
    // r 为非异步数据，不会引起 loading
    return runtimePromiseDeprecatedVarAssignment(() => (clonedModelRef.current.__race__ as RaceFn<T>)(r), promiseDeprecatedFromLocalService);
  }, []);

  // 赋值
  // 这个会在 useLocalService 里面使用
  if (!localServiceHasStatus[pureServiceKey]) {
    localServiceHasStatus[pureServiceKey] = localServicePure;
  }


  const firstRenderFlagRef = useRef(true);

  const susPersist = suspense?.persist;
  let depsIsDifferent = false;
  let promise;

  if (susKey && cache.has(susKey)) {
    promise = cache.get(susKey) as CustomerPromise;
    const dps = cacheDeps.get(susKey);
    depsIsDifferent = depsDifferent(dps, deps);
    if (!depsIsDifferent) {
      if (promise.success) {
        // 如果是useIndividualModel或者在发生throw的组件中生成的model，会在初始Suspense完成后完全重新生成（发生Suspense组件的特性：会恢复到throw前状态，再次尝试执行）
        // 所以这里需要将最后的data静默更新到model中去
        clonedModel.silent(promise.data);
        if (firstRenderFlagRef.current) {
          firstRenderFlagRef.current = false;
        }
      } else if (promise.success === false) {
        if (firstRenderFlagRef.current) {
          firstRenderFlagRef.current = false;
        }
      } else {
        throw promise;
      }
    }
  }

  // control：组件第一次挂载时，service的调用会被跳过
  if (firstRenderFlagRef.current && typeof service === 'function' && !isModel(control)) {
    firstRenderFlagRef.current = false;
    // 只有开启了 autoLoad 才会去主动发请求
    if (autoLoad) {
      const result = service(clonedModel(), undefined, []);
      if (isAsync(result)) {
        if (susKey) {
          const p: CustomerPromise = clonedModel.race(result).then((data) => {
            p.success = true;
            p.data = data;
          }).catch((err) => {
            p.success = false;
            return Promise.reject(err);
          });
          cache.set(susKey, p);
          cacheDeps.set(susKey, deps);
          throw p
        }
        // 这里更新了loading，会跳过当次渲染
        clonedModel.race(result);
      } else if (depsIsDifferent) {
        // 首次渲染出现了suspense状态下依赖变更的情况，这时会跳过上面的throw逻辑，重新执行一遍首次的请求逻辑
        // 当发现这次请求不是异步更新时，为了避免首次数据出现重置的情况（重置是发生suspense组件的特性），需要将上一次的promise throw出去以保证首次渲染时有数据
        if (promise?.success) {
          clonedModel.silent(promise.data);
        } else if (promise?.success === undefined ) {
          throw promise;
        }
      } else {
        clonedModel.race(result);
      }
    }
  }


  if (depsDifferent(depsRef.current, deps)) {
    if (susKey && susPersist && cache.has(susKey) && !depsIsDifferent) {
      cache.delete(susKey);
    } else if (typeof service === 'function') {
        // 只有开启了 autoLoad 才会主动发请求
        if (autoLoad) {
          const result = service(clonedModel(), undefined, getDifferentIndex(depsRef.current, deps));
          if (isAsync(result)) {
            const p = clonedModel.race(result);
            if (susPersist && susKey) {
              const tmpP: CustomerPromise = p.then((data) => {
                tmpP.success = true;
                tmpP.data = data;
              }).catch((err) => {
                tmpP.success = false;
                return Promise.reject(err);
              });
              cache.set(susKey, tmpP);
              cacheDeps.set(susKey, deps);
              throw tmpP;
            }
          } else if (depsIsDifferent) {
            // 如果当次是非异步更新且上一次是suspense状态，不管上一个promise有没有更新成功，都将其竞争掉
            cache.delete(susKey as string);
            clonedModel.race(result);
          } else {
            // 现在 race 可作用于非异步数据
            clonedModel.race(result);
          }
        }
      }
    depsRef.current = [...(deps || [])];
  } else if (susKey && cache.has(susKey)) {
    cache.delete(susKey);
  }

  useEffect(() => {
    return () => {
      cache.delete(susKey as string);
      cacheDeps.delete(susKey as string);
    };
  }, []);
  return [localServiceHasStatus as LocalService<T>];
}

export default useService;
