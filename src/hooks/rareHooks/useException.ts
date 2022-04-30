import {useEffect, useRef} from 'react';
import {ExceptionJudge, ManualException} from '../../../index';
import {manualThrownError} from '../../constants';

const useException = (...args: ExceptionJudge[]): ManualException => {
  const unmount = useRef(false);
  const exception = useRef<ManualException>({
    tryThrow: () => null,
  });
  exception.current.tryThrow = () => {
    if (unmount.current || args.some((f) => f())) {
      throw manualThrownError;
    }
  };
  useEffect(() => () => {
    unmount.current = true;
  }, []);
  return exception.current;
}

export default useException;
