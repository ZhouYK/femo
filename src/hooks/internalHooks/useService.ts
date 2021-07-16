import {useState} from "react";
import {GluerReturn, Service, ServiceOptions} from "../../../index";
import {isAsync} from "../../tools";
import gluer, {defaultReducer} from "../../gluer";

const useService = <T>(model: GluerReturn<T>, deps?: [Service<T>], options?: ServiceOptions) => {
  const [service] = deps || [];
  const { suspense } = options || {};
  const [firstRenderFlagRef] = useState(() => {
    return gluer(true);
  });
  const [serviceCacheRef] = useState(() => {
    return gluer(defaultReducer , service)
  });

  if (serviceCacheRef() && firstRenderFlagRef()) {
    firstRenderFlagRef.silent(false);
    const result = (serviceCacheRef() as Service<T>)(model());
    if (isAsync(result)) {
      if (suspense) throw model.race(() => result);
      // 这里更新了loading，会跳过当次渲染
      model.race(() => result);
    } else {
      model(result);
    }
  }

  if (!Object.is(serviceCacheRef(), service)) {
    serviceCacheRef.silent(() => service);
    if (service) {
      const result = (serviceCacheRef() as Service<T>)(model());
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
