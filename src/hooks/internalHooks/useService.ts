import { useCallback, useEffect, useRef } from 'react';
import { GluerReturn, LocalService, Service, ServiceOptions } from '../../../index';
import {isAsync, isModel} from '../../tools';

type CustomerPromise<T = any> = { success?: boolean; data?: T }  & Promise<T>;


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

const useService = <T>(model: GluerReturn<T>, service?: Service<T>, deps?: any[], options?: ServiceOptions): [LocalService<T>] => {
  const { suspenseKey, suspense, control } = options || {};
  const susKey = suspenseKey || suspense?.key;
  const depsRef = useRef<any[] | undefined>(deps);
  const serviceRef = useRef(service);
  serviceRef.current = service;
  const modelRef = useRef(model);
  modelRef.current = model;

  const localService = useCallback<LocalService<T>>((data) => {
    const r = serviceRef.current?.(modelRef.current(), data);
    if (isAsync(r)) {
      return modelRef.current.race(() => r as Promise<T>);
    }
    return Promise.resolve(modelRef.current(r as T)) as Promise<T>;
  }, []);

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
        model.silent(promise.data);
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
    const result = service(model());
    if (isAsync(result)) {
      if (susKey) {
        const p: CustomerPromise = model.race(() => result as Promise<T>).then((data) => {
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
      model.race(() => result as Promise<T>);
    } else if (depsIsDifferent) {
      // 首次渲染出现了suspense状态下依赖变更的情况，这时会跳过上面的throw逻辑，重新执行一遍首次的请求逻辑
      // 当发现这次请求不是异步更新时，为了避免首次数据出现重置的情况（重置是发生suspense组件的特性），需要将上一次的promise throw出去以保证首次渲染时有数据
      if (promise?.success) {
        model.silent(promise.data);
      } else if (promise?.success === undefined ) {
        throw promise;
      }
    } else {
      model(result);
    }
  }


  if (depsDifferent(depsRef.current, deps)) {
    if (susKey && susPersist && cache.has(susKey) && !depsIsDifferent) {
      cache.delete(susKey);
    } else if (typeof service === 'function') {
        const result = service(model());
        if (isAsync(result)) {
          const p = model.race(() => result as Promise<T>)
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
          model.race(() => Promise.resolve(result));
        } else {
            model(result);
        }
      }

    depsRef.current = [...(deps || [])];
  } else if (susKey && cache.has(susKey)) {
    cache.delete(susKey);
  }

  useEffect(() => {
    return () => {
      cacheDeps.delete(susKey as string);
    };
  }, []);
  return [localService];
}

export default useService;
