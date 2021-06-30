import {useRef} from "react";
import {GluerReturn, Service} from "../../../index";
import {isAsync} from "../../tools";

const useService = <T>(model: GluerReturn<T>, deps?: [Service<T>]) => {
  const [service] = deps || [];
  const firstRenderFlagRef = useRef(true);
  const serviceCacheRef = useRef(service);

  if (service && firstRenderFlagRef.current) {
    firstRenderFlagRef.current = false;
    const result = service(model());
    if (isAsync(result)) {
      // 这里更新了loading，会跳过当次渲染
      model.race(() => result);
    } else {
      model(result);
    }
  }

  if (service && !Object.is(serviceCacheRef.current, service)) {
    const result = service(model());
    if (isAsync(result)) {
      model.race(() => result);
    } else {
      model(result);
    }
  }
}

export default useService;
