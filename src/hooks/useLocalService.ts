import { useCallback, useEffect, useRef, useState } from 'react';
import { LocalService, LocalServiceHasStatus, ServiceStatus } from '../../index';
import { promiseDeprecated, promiseDeprecatedFromClonedModel, pureServiceKey, resolveCatchError } from '../constants';
import { promiseDeprecatedError } from '../genRaceQueue';

interface IndividualServiceOptions {
  bubble?: boolean;
}

const defaultOptions: IndividualServiceOptions = {
  bubble: false,
};

const useLocalService = <S>(service: LocalService<S>, options?: IndividualServiceOptions): [LocalService<S>, Omit<ServiceStatus<S>, 'service'>] => {
  const unmountedFlagRef = useRef(false);
  const serviceRef = useRef<LocalServiceHasStatus<S>>(service);
  serviceRef.current = service;
  const optionsRef = useRef({
    ...defaultOptions,
    ...options,
  });
  optionsRef.current = {
    ...defaultOptions,
    ...options,
  };

  const [status, updateStatus] = useState<Omit<ServiceStatus<S>, 'service'>>(() => {
    return {
      loading: false,
      successful: false,
    }
  });

  const newService = useCallback<LocalService<S>>((data) => {
    const { bubble } = optionsRef.current;
    const resultService = bubble ? serviceRef.current : serviceRef.current[pureServiceKey] as LocalService<S>;
    const p = resultService(data);
    updateStatus((prevState) => ({
      ...prevState,
      loading: true,
      successful: false,
    }));
    // catch 和 then 的先后顺序会影响执行顺序
    // 最优先处理错误
    p.catch((err) => {
      if (unmountedFlagRef.current) return resolveCatchError;
      // 如果不是异步竞争引起的异常，则需要设置loading状态
      // 详细信息请看 useCloneModel
      if (err !== promiseDeprecatedError || (err === promiseDeprecatedError && (promiseDeprecated in p || promiseDeprecatedFromClonedModel in p))) {
        updateStatus((prevState) => {
          return {
            ...prevState,
            loading: false,
            successful: false,
          }
        });
      }
      return resolveCatchError;
    }).then((info) => {
      if (unmountedFlagRef.current || info === resolveCatchError) return;
      updateStatus((prevState) => ({
        ...prevState,
        loading: false,
        successful: true,
      }))
    });
    return p;

  }, []);

  useEffect(() => {
    return () => {
      unmountedFlagRef.current = true;
    }
  }, []);

  return [newService, status];
}

export default useLocalService;
