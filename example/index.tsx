import React from 'react';
import { render } from 'react-dom';
import femo from '../src';
import family from '../test/models/family';

const App = () => {
  const store_1 = femo({
    family
  });
  const store_2 = femo({
    family
  });

  store_1.model.family({
    count: 5
  });

  // @ts-ignore
  console.log(store_1.referToState(store_1.model.family.papa.name));

  // @ts-ignore
  console.log(store_2.referToState(store_2.model.family.papa.name));

  return null;
};

render(<App />, document.getElementById('bd'));
