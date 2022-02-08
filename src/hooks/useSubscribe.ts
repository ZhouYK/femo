import {useEffect, useState} from 'react';
import {Callback, GluerReturn} from '../../index';
import subscribe from '../subscribe';

const useSubscribe = (models: GluerReturn<any>[], callback: Callback, callWhenSub?: boolean) => {

  const [unsub] = useState(() => {
    return subscribe(models, (...args: any[]) => {
      callback(...args);
    }, callWhenSub);
  });

  useEffect(() => unsub, []);

}

export default useSubscribe;
