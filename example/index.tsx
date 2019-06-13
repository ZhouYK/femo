import React from 'react';
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

// unsubscribe
unsubscribe();

const App = (props: any) => {
  console.log(props);
  return null;
};

const WrappedApp = store.react([store.model.surface], (surface: any) => {
  return {
    surface
  }
})(App);

setTimeout(() => {
  store.model.surface({
    cpu: 'ausu',
    monitor: 'acer'
  });
}, 2000);

render(<WrappedApp />, document.getElementById('bd'));
