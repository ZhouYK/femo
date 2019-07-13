import React, { useState } from 'react';
import { render } from 'react-dom';
// @ts-ignore
import femo, { gluer } from '../src';

const computer = gluer((data, state) => {
  return { ...state, ...data }
}, { cpu: 'intel', monitor: 'dell' });

const electronicDevice = {
  computer,
  surface: computer,
  mbp: computer
};
const store = femo(electronicDevice);

console.log(store.getState());
// { computer: { cpu: 'intl', monitor: 'dell' }, surface: { cpu: 'intl', monitor: 'dell' }, mbp: { cpu: 'intl', monitor: 'dell' } }

// Here are more usages!

// subscribe the specific part of model
const unsubscribe = store.subscribe([store.model.surface], (_surface: any) => {
  // if surface changes, this callback will be called
});

// get data from the store by the model reference
console.log(store.referToState(store.model.surface)); // { cpu: 'intl', monitor: 'dell' }

// judge a index whether it is in the model
console.log(store.hasModel(store.model.surface)); // true
console.log(store.hasModel('index')); // false


// custom handler
// It will hijack the data process
// The original data handler will not be executed
store.model.surface({
    cpu: 'i7',
    monitor: 'asus'
}, (data, state) => {
    const temp = { ...data };
    temp.cpu = `surface-${temp.cpu}`;
    temp.monitor = `surface-${temp.monitor}`;
    return { ...state, ...temp };
});

console.log(store.referToState(store.model.surface)); // { cpu: 'surface-i7', monitor: 'surface-asus' }

// support async effects

(store.model.surface({
    cpu: '哈哈',
    monitor: '哼哼'
}, async function test (data, state) {
    console.log(data, state);
    // data { cpu: '哈哈', monitor: '哼哼' }
    // state { cpu: 'surface-i7', monitor: 'surface-asus' }
    // do effects here
    // then return the result to update the state
    return {
        cpu: 'i9',
        monitor: 'Huawei'
    }
}) as Promise<{cpu: string, monitor: string}>).then((res) => {
    console.log(res); // { cpu: 'i9', monitor: 'Huawei' }
    console.log(store.referToState(store.model.surface)); // { cpu: 'i9', monitor: 'Huawei' }
});

console.log(store.referToState(store.model.surface)); // { cpu: 'surface-i7', monitor: 'surface-asus' }
// unsubscribe
unsubscribe();

const App = () => {
  const [state, stateUpdator] = useState(() => {
    let temp;
    store.subscribe([store.model.surface], (surface) => {
      temp = surface;
      if (stateUpdator) {
        stateUpdator(surface);
      }
    });
    return temp;
  });
  console.log(state);
  return null;
};
setTimeout(() => {
  store.model.surface({
    cpu: 'ausu',
    monitor: 'acer'
  });
}, 2000);

render(<App />, document.getElementById('bd'));
