<a href="https://996.icu"><img src="https://img.shields.io/badge/link-996.icu-red.svg"></a>
[![Build Status](https://travis-ci.com/ZhouYK/femo.svg?branch=master)](https://travis-ci.com/ZhouYK/femo)
[![codecov](https://codecov.io/gh/ZhouYK/femo/branch/master/graph/badge.svg)](https://codecov.io/gh/ZhouYK/femo)
[![NPM version](https://img.shields.io/npm/v/femo.svg?style=flat)](https://www.npmjs.com/package/femo)
[![NPM downloads](http://img.shields.io/npm/dm/femo.svg?style=flat)](https://www.npmjs.com/package/femo)
![package size](https://img.shields.io/bundlephobia/minzip/femo.svg?style=flat)
![license](https://img.shields.io/github/license/ZhouYK/glue-redux.svg)
## femo

*function-centric data management inspired by [redux](https://github.com/reduxjs/redux)*

### release
[![NPM version](https://img.shields.io/npm/v/femo.svg?style=flat)](https://www.npmjs.com/package/femo)

```bash
npm i femo
or
yarn add femo
```

### Overview

*model derives state*

![model](./assets/model.jpg)
___

*retrieve the "p3"*

![retrieve](./assets/retrieve.jpg)
```js
referToState(model.p1.p3)
```
___

*update the "p3"*

![update](./assets/update.jpg)

```js
model.p1.p3(data)
```
### Basic

#### Model

Model is just plain object. It consists of different nodes those present structure and maintain data.
Model is a blueprint what data structure you want.

For example
```js
import { gluer } from 'femo';
const computer = gluer((data, state) => {
  return { ...state, ...data }
}, { cpu: 'intel', moniter: 'dell' });

const electronicDevice = {
  computer,
};
export default electronicDevice;
```

Here, *computer* is not a model but a part of the *electronicDevice* model, which is a plain object.

The *computer* out of a model is just a *template*(a bit like the concept of **Class**) which can be reused in unlimited models.It means what data it represents and how to mutate the data.
We call this *computer* as a *maintainable node*.

A *maintainable node* in a model will produce a *maintainable node instance* to replace itself. This is why *maintainable node* is called *template*.

*We can reuse the *maintainable node---computer* without limit times.*

```js
import { gluer } from 'femo';
const computer = gluer((data, state) => {
  return { ...state, ...data }
}, { cpu: 'intel', monitor: 'dell' });

const electronicDevice = {
  computer,
  surface: computer,
  mbp: computer
};
export default electronicDevice;
```

#### Let model work

*Stress again, model is plain object.*

To translate model into real data, just do below.

```js
import femo from 'femo';
import electronicDevice from './electronicDevice';
const store = femo(electronicDevice);

console.log(store.getState());
// { computer: { cpu: 'intl', monitor: 'dell' }, surface: { cpu: 'intl', monitor: 'dell' }, mbp: { cpu: 'intl', monitor: 'dell' } }

// Here are more usages!

// subscribe the specific part of model
const unsubscribe = store.subscribe([store.model.surface], (surface) => {
  // if surface changes, this callback will be called
});

// get data from the store by the model reference
console.log(store.referToState(store.model.surface)); // { cpu: 'intl', monitor: 'dell' }

// judge a index whether it is in the model
console.log(store.hasModel(store.model.surface)) // true
console.log(store.hasModel('index')) // false

// unsubscribe
unsubscribe();
```

### More
*more docs and illustration are coming soon*
