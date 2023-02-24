import {useEffect, useState} from 'react';
import {Callback, FemoModel} from '../../../index';
import subscribe from '../../core/subscribe';

const useSubscribe = (models: FemoModel<any>[], callback: Callback, callWhenSub?: boolean) => {

  const [unsub] = useState(() => {
    return subscribe(models, (...args: any[]) => {
      callback(...args);
    }, callWhenSub);
  });

  useEffect(() => unsub, []);

}

export default useSubscribe;
