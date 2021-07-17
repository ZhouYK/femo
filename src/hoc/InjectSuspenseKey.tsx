// eslint-disable-next-line no-use-before-define
import React, {FC, useState} from "react";

let key = 0;
const InjectSuspenseKey = <P, _T = any>(Component: FC<P>) => {
  return (count = 1) => {
    if (count <= 0) {
      count = 1;
      console.warn('count 需要大于0');
    }
    // @ts-ignore
    const NewComponent: FC<Omit<P, 'suspenseKey'>> = (props: P) => {
      const [keys] = useState(() => {
        const arr: number[] = [];
        for (let i = 0; i < count; i += 1) {
          key += 1;
          arr.push(key);
        }
        return arr;
      });
      return <Component { ...props } suspenseKey={keys} />
    };
    NewComponent.displayName = Component.displayName || Component.name;

    return NewComponent;
  }
}

export default InjectSuspenseKey;
