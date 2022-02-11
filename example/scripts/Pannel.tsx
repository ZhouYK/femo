import React, {FC, useCallback, useEffect} from 'react';
import List from './List';
import Profile from './Profile';
import {gluer, useModel} from '../../src/index';

const count = gluer(0);

const Pannel: FC = () => {


  const onChange = useCallback((nextState: any, prevState: any) => {
    console.log('nextState：', nextState, 'prevState：', prevState);
  }, []);

  const service = useCallback((n: number) => {
    return n;
  }, []);

  const [num] = useModel(count,[service], {
    onChange,
  });

  useEffect(() => {
    setInterval(() => {
      count.race(() => Promise.resolve(count() + 1));
    }, 5000);
  }, []);

  console.log('num', num);

  return (
    <section style={{ display: 'flex' }}>
      <section style={{ flex:  '0 1 50%', display: 'flex', justifyContent: 'center', }}>
        <List />
      </section>
      <section style={{ flex: '0 1 50%', display: 'flex', justifyContent: 'center' }}>
        <Profile />
      </section>
    </section>
  )
}

export default Pannel;
