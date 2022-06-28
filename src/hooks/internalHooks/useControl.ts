import { useRef } from 'react';
import { LoadingStatus } from '../../../index';
import gluer from '../../gluer';

const useControl = <S>(state: S , status: LoadingStatus) => {
  const controlRef = useRef(
    gluer({
      ...(status),
      data: state,
    })
  );

  return controlRef.current;
}

export default useControl;
