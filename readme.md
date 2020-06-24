<a href="https://996.icu"><img src="https://img.shields.io/badge/link-996.icu-red.svg"></a>
[![Build Status](https://travis-ci.com/ZhouYK/femo.svg?branch=master)](https://travis-ci.com/ZhouYK/femo)
[![codecov](https://codecov.io/gh/ZhouYK/femo/branch/master/graph/badge.svg)](https://codecov.io/gh/ZhouYK/femo)
[![NPM version](https://img.shields.io/npm/v/femo.svg?style=flat)](https://www.npmjs.com/package/femo)
[![NPM downloads](http://img.shields.io/npm/dm/femo.svg?style=flat)](https://www.npmjs.com/package/femo)
![package size](https://img.shields.io/bundlephobia/minzip/femo.svg?style=flat)
![license](https://img.shields.io/github/license/ZhouYK/glue-redux.svg)
# femo

*针对数据操作的可预知、易测试的抽象封装*

### 发布 [![NPM version](https://img.shields.io/npm/v/femo.svg?style=flat)](https://www.npmjs.com/package/femo)

```bash
npm i femo
or
yarn add femo
```

---
### 概述

1. 每个定义的数据节点之间是独立的。
2. 没有一个集中的store，数据节点的组织是分散的，可组合但不支持嵌套。
3. 每个数据节点包含了：输入、处理过程、输出，除此之外再无其他功能。
4. 数据节点中处理过程可是异步的。
5. 数据节点异步更新出现竞争时，可由数据节点外部方法genRaceQueue解决。
6. 数据的订阅由数据节点外部方法subscribe实现。
7. 核心api两个：gluer和subscribe，增强功能api一个: genRaceQueue，总共三个api。

### API介绍

#### gluer

> 定义数据节点

定义一个数据节点：
```js
import { gluer } from 'femo';

const name = gluer('初始名字');

```

定义好了后就可以直接使用了，比如直接更新名字

```js
  name('张三');
```

更新后获取最新的名字

```js
  name(); // 张三
```

试一试通过指定函数来更新数据
```js
  name((data, state) => {
    return '李四';
  });
```

获取最新的名字
```js
  name(); // 李四
```

再试试指定一个异步函数来更新数据
```js
  name(async (data, state) => {
    return '王二';
  });
```
异步函数更新数据会是异步的，所以获取更新后的名字应该这样
```js
  (async function () {
              await name(async (data, state) => {
                          return '王二';
                        });
                 name(); // 王二
            })();
```
或者
```js
    name(async (data, state) => {
        return '王二';
      }).then(() => {
        name(); // 王二
      });
```


#### subscribe
> 订阅数据节点

数据节点被订阅过后，其数据的变化会通知到订阅的回调函数里面。
```js
import { gluer, subscribe } from 'femo';

const name = gluer('初始名字');

const unsubscribe = subscribe([name], (nameData) => { console.log(nameData) });
name('张胜男');
// 会打印 张胜男

// 取消监听。调用返回的函数即可
unsubscribe();
```

#### genRaceQueue
> 数据更新出现竞争时，可用。

这个主要针对异步更新，保证数据的一致性。

什么是异步竞争？

常见的，先后发送了两个请求p1和p2，p1和p2都有各自的异步回调处理逻辑。一般情况下，先发出去的请求先回来，后发出去的请求后回来。 这种情况下异步回调的处理逻辑的先后顺序是符合预期的。但存在另外的情况，p1请求先发送后返回，p2请求后发送先返回。那么异步回调的处理顺序就不再是 p1的异步回调 => p2的异步回调，而是 p2的异步回调 => p1的异步回调。这种执行顺序显然是不符合预期的，会导致问题。

```js
import { genRaceQueue } from 'femo';
// 首先创建一个异步队列
const raceQueue = genRaceQueue();

// 然后将会出现竞争的异步promise放到同一个异步队列中

// p1请求
raceQueue.push(someModel(params, async (data, state) => {
                                      return await fetchRemote(data);
                                    }));
// p2请求
raceQueue.push(someModel(async (data, state) => { return await fetchRemote() }));

```

### 类型支持

⚡️强烈建议使用typescript

