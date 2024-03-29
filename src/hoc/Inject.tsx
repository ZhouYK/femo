import React, {FC, useState} from 'react';
import {InjectProps} from '../../index';

const keyPrefix = 'femo-suspense-key';
let key = 0;
const Inject = <P extends InjectProps, _T = any>(Component: FC<P>) => {
  return (count = 1) => {
    if (count <= 0) {
      count = 1;
      console.warn('count 需要大于0');
    }
    // @ts-ignore
    const NewComponent: FC<Omit<P, 'suspenseKeys'>> = (props: P) => {
      const [keys] = useState(() => {
        const arr: string[] = [];
        for (let i = 0; i < count; i += 1) {
          key += 1;
          arr.push(`${keyPrefix}-${key}`);
        }
        return arr;
      });
      return <Component { ...props } suspenseKeys={keys} />
    };
    NewComponent.displayName = Component.displayName || Component.name;

    return NewComponent;
  }
}

export default Inject;
