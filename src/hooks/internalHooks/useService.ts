import {useRef} from "react";
import {GluerReturn, Service, ServiceOptions} from "../../../index";
import {isAsync} from "../../tools";

const useService = <T>(model: GluerReturn<T>, deps?: [Service<T>], options?: ServiceOptions) => {
  const [service] = deps || [];
  const { suspense } = options || {};
  const firstRenderFlagRef = useRef(true);
  const serviceCacheRef = useRef(service);

  if (service && firstRenderFlagRef.current) {
    firstRenderFlagRef.current = false;
    const result = service(model());
    if (isAsync(result)) {
      if (suspense) throw model.race(() => result);
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
        if (suspense) throw model.race(() => result);
        model.race(() => result);
      } else {
        model(result);
      }
    }
  }
}

export default useService;
