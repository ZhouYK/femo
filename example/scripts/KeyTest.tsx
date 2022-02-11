import React, {FC, useEffect, useRef, useState} from 'react';
import KeyChildren from './KeyChildren';

interface Props {

}

const KeyTest: FC<Props> = (_props) => {

  const [status, upStatus] = useState<number>(0);

  const onClick = () => {
    upStatus((prevState) => {
      if (prevState === 0) {
        return 1
      }
      return 0
    });
  }

  const cacheRef = useRef<any>(null);

  const seRef = useRef<HTMLDivElement>(null);
  const arr = [
    <section ref={seRef} className={`${status}`} key={status} onClick={() => { console.log('status 1') }}>我是section，我的值是{status}</section>,
    <section className={`${status}`} key={status} onClick={() => { console.log('status 2') }}>我是span，我的值是{status}</section>,
  ];

  useEffect(() => {
    console.log('dom', seRef.current);
    if (!cacheRef.current) {
      cacheRef.current = seRef.current;
    }
    console.log('cache', cacheRef.current);
  }, [status]);

  return (
    <>
      <button onClick={onClick}>切换</button>
      <KeyChildren>
        {arr}
      </KeyChildren>
    </>
  )

}

export default KeyTest;
