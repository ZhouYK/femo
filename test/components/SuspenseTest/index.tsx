import React, { Suspense, FC, useState } from 'react';
import Child from './Child';

interface Props {

}

const SuspenseTest: FC<Props> = () => {
  const [a, updateA] = useState(0);
  const [b, updateB] = useState(0);

  const onClick = () => {
    updateA((preA) => preA + 1);
  }

  const onStop = () => {
    updateB((prevB) => prevB + 1);
  }

  return (
    <>
      <button onClick={onClick}>发起请求</button>
      <button onClick={onStop}>停止请求</button>
      <Suspense fallback='加载中'>
        <Child a={a} b={b} />
      </Suspense>
    </>
  )
}

export default SuspenseTest;
