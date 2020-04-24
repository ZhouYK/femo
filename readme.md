<a href="https://996.icu"><img src="https://img.shields.io/badge/link-996.icu-red.svg"></a>
[![Build Status](https://travis-ci.com/ZhouYK/femo.svg?branch=master)](https://travis-ci.com/ZhouYK/femo)
[![codecov](https://codecov.io/gh/ZhouYK/femo/branch/master/graph/badge.svg)](https://codecov.io/gh/ZhouYK/femo)
[![NPM version](https://img.shields.io/npm/v/femo.svg?style=flat)](https://www.npmjs.com/package/femo)
[![NPM downloads](http://img.shields.io/npm/dm/femo.svg?style=flat)](https://www.npmjs.com/package/femo)
![package size](https://img.shields.io/bundlephobia/minzip/femo.svg?style=flat)
![license](https://img.shields.io/github/license/ZhouYK/glue-redux.svg)
# femo

*针对对象操作的可预知、易测试的抽象封装*

### 发布 [![NPM version](https://img.shields.io/npm/v/femo.svg?style=flat)](https://www.npmjs.com/package/femo)

```bash
npm i femo
or
yarn add femo
```

---
### 概览

#### 对象的模型

![model](./assets/model.jpg)

#### 获取对象的属性

![retrieve](./assets/retrieve.jpg)
```js
referToState(model.p1.p3)
```

#### 更新对象的属性

![update](./assets/update.jpg)

```js
model.p1.p3(data)
```

#### 发现

调用模式和原始的对象操作非常类似。看到这或许回想到mobx或者vuex。是的，和mobx、vuex在形上是很一致的，区别在于femo没有使用属性劫持或代理。

femo内部维护了一个抽象层。抽象层是树状结构，非对象类型(比如string、number、array、map、set等)的节点会被当做叶子节点，对象节点可以扩展子节点。
可以通过记录抽象层每个节点来获取数据、操作数据、监听每个数据变化。

那么如何创建抽象层呢？抽象层是由一个个节点组成的，那么先来看如何创建一个节点。

---

### 创建一个节点

```js
import { gluer } from 'femo';
const computer = gluer((data, state) => {
  return { ...state, ...data }
}, { cpu: 'intel', monitor: 'dell' });
```

节点的生成：
* 节点由gluer定义
* 节点包括两部分: 处理函数和初始值


#### 处理函数

**处理函数**的入参:

| data | state |
| :--- | :---  |
| 节点从外部接收的入参 | 节点当前的数据 |

**处理函数**的返回会作为节点新的值。


##### 初始值

**初始值**有两个作用：

* 节点初始的数据
* 节点的数据类型

初始值的类型会限制**处理函数**的入参**state**以及函数返回。

这里需要解释一下初始值作为节点数据类型的原因。最主要的原因是要对节点代表的数据在静态时需要有一个明确的类型限制和提示，便于代码的维护。

我们都知道javascript是一个动态类型的语言，一个变量的类型随时都可能变，这在一个上了规模的项目里面是很可怕的。近两年typescript在前端的兴起，代表了静态类型的趋势。
这里也借助了typescript的能力。

节点创建好了并不能直接当做数据来使用，需要通过节点来生成对象，通过对象才能被当做数据来使用。

> 这里隐含了一个信息，那就是节点可以被复用

---

### 创建对象

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

这样就具备了生成对应数据的能力了。

需要明确一点：**创建的节点只有直接放在在对象里面才会生效，其他的不会生效**。

```js
// 不会生效
const electronicDevice = {
  list: [computer]
}

// 不会生效
const electronicDevice = {
  list: new Map([computer]),
};

// 生效
const electronicDevice = {
  list: computer,
}

```

---

### 应用对象

由节点生成的对象已经准备好了，现在需要让这些对象生效

```js
import femo from 'femo';
import electronicDevice from './electronicDevice';
const store = femo(electronicDevice);
```

将对象传递给**femo**函数，会得到一个工具对象store。所有对数据的相关操作都可以在store上找到。

```js
// 获取整个数据对象
console.log(store.getState());
// { computer: { cpu: 'intl', monitor: 'dell' }, surface: { cpu: 'intl', monitor: 'dell' }, mbp: { cpu: 'intl', monitor: 'dell' } }

// 监听某个节点
const unsubscribeSurface = store.subscribe([store.model.surface], (surface) => {
  // 如果surface节点对应的数据有变动，会执行该回调
});

// 取消
unsubscribeSurface();

// 获取某个节点的数据
console.log(store.referToState(store.model.surface)); // { cpu: 'intl', monitor: 'dell' }

// 判断节点是否存在
console.log(store.hasModel(store.model.surface)) // true
console.log(store.hasModel('index')) // false

// 更新节点数据
// 此时会调用定义节点时传入的处理函数处理数据
// 如果定义节点时没有传入任何处理函数，那么会提供一个默认的处理函数。该函数是 f(x) = x;
// surfaceState_1 是surface节点最新的state
const surfaceState_1 = store.model.surface({
    cpu: 'i5',
    monitor: 'lenovo',
});

// 自定义数据处理函数
// 此时数据处理时只会调用自定义数据处理函数，定义节点时传入的处理函数不会执行
const surfaceState_2 = store.model.surface({
	cpu: 'i7',
	monitor: 'asus'
}, (data, state) => {
  const temp = { ...data };
  temp.cpu = `surface-${temp.cpu}`;
  temp.monitor = `surface-${temp.monitor}`;
  return { ...state, ...temp };
});

console.log(store.referToState(store.model.surface)); // { cpu: 'surface-i7', monitor: 'surface-asus' }

// 支持异步的自定义处理函数
// surfaceState_3 是一个promise，surface节点的数据更新会延后

const surfaceState_3 = store.model.surface({
	id: '123'
}, async (data, state) => {
    // data { id: '123' }
    // state { cpu: 'surface-i7', monitor: 'surface-asus' }
    return {
        cpu: 'i9',
        monitor: 'Huawei'
    }
}).then((res) => {
    console.log(store.referToState(store.model.surface) === res); //true { cpu: 'i9', monitor: 'Huawei' }
});
console.log(store.referToState(store.model.surface)); // { cpu: 'surface-i7', monitor: 'surface-asus' }
```

---

### 类型支持

⚡️强烈建议使用typescript

