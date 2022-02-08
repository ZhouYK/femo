import {useRef} from 'react';
import {GluerReturn, Service, ServiceOptions} from '../../../index';
import {isAsync, isModel} from '../../tools';

type CustomerPromise<T = any> = { success?: boolean; data?: T }  & Promise<T>;

const cache: { [index: string]: CustomerPromise } = {  };

const useService = <T>(model: GluerReturn<T>, deps?: [Service<T>], options?: ServiceOptions) => {
  const [service] = deps || [];
  const firstRenderFlagRef = useRef(true);
  const serviceCacheRef = useRef(service);

  const { suspenseKey, cache: cacheFlag, control } = options || {};
  const methodName = cacheFlag ? 'cache' : 'race';
  if (suspenseKey) {
    if (cache[suspenseKey]) {
      const promise = cache[suspenseKey] as CustomerPromise;
      if (promise.success) {
        model.silent(promise.data);
        firstRenderFlagRef.current = false;
        delete cache[suspenseKey];
      } else if (promise.success === false) {
        firstRenderFlagRef.current = false;
        delete cache[suspenseKey];
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
      if (suspenseKey) {
        const p: CustomerPromise = model[methodName](() => result as Promise<T>).then((data) => {
          p.success = true;
          p.data = data;
        }).catch((err) => {
          p.success = false;
          return Promise.reject(err);
        });
        cache[suspenseKey] = p;
        throw p
      }
      // 这里更新了loading，会跳过当次渲染
      model[methodName](() => result as Promise<T>);
    } else {
      model(result);
    }
  }

  if (!Object.is(serviceCacheRef.current, service)) {
    serviceCacheRef.current = service;
    if (typeof service === 'function') {
      const result = service(model());
      if (isAsync(result)) {
        model[methodName](() => result as Promise<T>);
      } else {
        model(result);
      }
    }
  }
}

export default useService;
