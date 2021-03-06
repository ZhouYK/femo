import {useRef} from "react";
import {GluerReturn, Service, ServiceOptions} from "../../../index";
import {isAsync} from "../../tools";

type CustomerPromise<T = any> = { success?: boolean; data?: T }  & Promise<T>;

const cache: { [index: string]: CustomerPromise } = {  };

const useService = <T>(model: GluerReturn<T>, deps?: [Service<T>], options?: ServiceOptions) => {
  const [service] = deps || [];
  const firstRenderFlagRef = useRef(true);
  const serviceCacheRef = useRef(service);

  const { suspenseKey } = options || {};
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

  if (service && firstRenderFlagRef.current) {
    firstRenderFlagRef.current = false;
    const result = service(model());
    if (isAsync(result)) {
      if (suspenseKey) {
        const p: CustomerPromise = model.race(() => result).then((data) => {
          p.success = true;
          p.data = data;
        }).catch(() => {
          p.success = false;
        });
        cache[suspenseKey] = p;
        throw p
      }
      // 这里更新了loading，会跳过当次渲染
      model.race(() => result);
    } else {
      model(result);
    }
  }

  if (!Object.is(serviceCacheRef.current, service)) {
    serviceCacheRef.current = service;
    if (service) {
      const result = service(model());
      if (isAsync(result)) {
        model.race(() => result);
      } else {
        model(result);
      }
    }
  }
}

export default useService;
