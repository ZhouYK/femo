import { useRef, useState } from 'react';
import { GluerReturn, LoadingStatus, ServiceControl } from '../../../index';
import gluer from '../../gluer';

const useControl = <S = any>(model: GluerReturn<S> , status: LoadingStatus) => {
  const modelRef = useRef(model());
  const statusRef = useRef(status);


  const [control] = useState<GluerReturn<ServiceControl<S>>>(() => {
    return gluer(() => {
      return {
        ...(statusRef.current),
        data: modelRef.current,
      }
    })
  });

  if (!Object.is(modelRef.current, model()) || !Object.is(statusRef.current, status)) {
    const data = model();
    control({
      ...status,
      data,
    });
    modelRef.current = data;
    statusRef.current = status;
  }

  return [control];
}

export default useControl;
