import { useEffect, useRef } from 'react';
import { FemoModel } from '../../index';
import { isModel } from '../tools';
import useDerivedState from '../hooks/useDerivedState';

const genRegister = <M>() => {
  const map = new Map<string, FemoModel<any>>();

  const res = {
    register: <K extends keyof M>(key: K, model: M[K]) => {
      if (typeof key !== 'string') {
        console.warn('registered key should be string');
        return;
      }

      if (!key) {
        console.warn('registered key should not be empty');
        return;
      }

      if (map.has(key as string)) {
        console.warn(`registered key: ${key} is exist, its value will be override`);
      }
      // @ts-ignore
      map.set(key as string, model);
    },
    unregister: <K extends keyof M>(key: K, model?: M[K]): void => {
      if (!isModel(model)) {
        map.delete(key as string);
        return;
      }
      if (Object.is(map.get(key as string), model)) {
        map.delete(key as string);
      }
    },
    pick: <K extends keyof M>(key: K): M[K] => {
      // @ts-ignore
      return map.get(key as string)
    },

    useRegister: <K extends keyof M>(key: K, model: M[K]): void => {
      const keyRef = useRef(key);
      const modelRef = useRef(model);


      useDerivedState(() => {
        res.unregister(keyRef.current);
        res.register(key, model);
        keyRef.current = key;
        modelRef.current = model;
      }, [key, model])

      useEffect(() => {
        return () => {
          res.unregister(keyRef.current, modelRef.current)
        }
      }, []);
    },
    usePick: <K extends keyof M>(key: K): M[K] => {
      return res.pick(key);
    },
  }
  return res;
}

export default genRegister;
