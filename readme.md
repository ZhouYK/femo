<a href="https://996.icu"><img src="https://img.shields.io/badge/link-996.icu-red.svg"></a>
[![Build Status](https://travis-ci.com/ZhouYK/femo.svg?branch=master)](https://travis-ci.com/ZhouYK/femo)
[![codecov](https://codecov.io/gh/ZhouYK/femo/branch/master/graph/badge.svg)](https://codecov.io/gh/ZhouYK/femo)
[![NPM version](https://img.shields.io/npm/v/femo.svg?style=flat)](https://www.npmjs.com/package/femo)
[![NPM downloads](http://img.shields.io/npm/dm/femo.svg?style=flat)](https://www.npmjs.com/package/femo)
![package size](https://img.shields.io/bundlephobia/minzip/femo.svg?style=flat)
![license](https://img.shields.io/github/license/ZhouYK/glue-redux.svg)
# femo

*针对数据操作的可预知、易测试的抽象封装*

## 发布 [![NPM version](https://img.shields.io/npm/v/femo.svg?style=flat)](https://www.npmjs.com/package/femo)

```bash
npm i femo
or
yarn add femo
```

---
## 概述

1. 每个定义的数据节点之间是独立的。
2. 没有一个集中的store，数据节点的组织是分散的，可组合但不支持嵌套。
3. 每个数据节点包含了：输入、处理过程、输出，除此之外再无其他功能。
4. 数据节点中处理过程可是异步的。
5. 数据节点异步更新出现竞争时，可由数据节点外部方法genRaceQueue解决。
6. 数据的订阅由数据节点外部方法subscribe实现。
7. 核心api两个：gluer和subscribe，增强功能api一个: genRaceQueue，两个自定义hook: useModel、useDerivedStateToModelFromProps。

## 以下是工具函数

### gluer

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


### subscribe
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

### genRaceQueue
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
### useModel
> 自定义hook，用于消费节点数据

```js
// 定义一个节点
const list = gluer({ page: 1, size: 20, total: 0, list: [] });

// 在函数组件中使用useModel消费数据

const [listData] = useModel(list);

// 每次list的变动都会通知useModel，useModel更新listData，rerender组件
// 和useState很类似

```

### useDerivedStateToModelFromProps
> 自定义hook，用于将props中的衍生数据更新到model中去，统一使用model的数据
> 和react组件中[getDerivedStateFromProps](https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops) 功能一致

## 以下是节点上的方法

#### relyOn
> 数据节点上的方法

适用的场景：多个数据节点的变化都可引起一个数据节点更新，多对一的关系。

```javascript
const demo1 = gluer(null);
const demo2 = gluer(null);
const demo3 = gluer(null);

const demo = gluer(null);

const unsubscribe = demo.relyOn([demo1, demo2, demo3], (data, state) => 
{
 // data[0] 为 demo1的值
 // data[1] 为 demo2的值
 // data[2] 为 demo3的值
 // state 为 demo的值
 // 需要返回demo的最新值
})

// 解除依赖
unsubscribe();
```

定义节点之间的单向依赖关系，入参返回如下：

|入参   | 含义 |
| :----| :---- |
| 节点数组 |定义依赖的节点。放置的顺序会直接影响取值顺序|

|入参   | 含义 |
| :---- | :---- |
| 回调函数 | 形如(data, state) => state。data是节点数据值的数组，与节点数组一一对应。state 是监听的节点的值。回调函数需要返回监听节点的新值 |

relyOn处理数据依赖更新是单向的。通常情况下适合处理结构上没有嵌套的彼此独立的节点。

需要注意的是，如果是要处理数据的双向依赖，比如：
```javascript
a.relyOn([b], (data, state) => {
  // todo
});

b.relyOn([a], (data, state) => {
  // todo
})
```
特别注意不要引起死循环！

#### silent
> 数据节点上的方法

该方法和直接使用节点更新一样，只是不会进行数据更新的广播。
在需要优化组件渲染频率的时候可以考虑使用它。

#### track
> 数据节点上的方法

节点开始记录状态历史，并把当前状态做为记录状态的起始状态。

```javascript
const page = gluer('page 1');
page.track(); // 开始记录 page的变更历史
```
 #### flush
 > 数据节点上的方法

节点停止记录状态历史，并把记录的状态历史清空。和track搭配使用

```javascript
const page = gluer('page 1');
page.track(); // 开始记录 page的变更历史
// 中间省略若干代码
page.flush(); // 停止记录 清除page变更历史
```
#### go
> 数据节点上的方法

在节点记录的状态历史中前进后退，达到历史状态的快速重现和恢复。

| 入参 | 含义 |
| :--- | :--- |
| step(Number类型) | 整数。负数表示后退多少个记录，正数表示前进多少个记录 |

```javascript
const page = gluer('page 1');
page.track(); // 开始记录 page的变更历史

page('page 2');

page('page 4');

page.go(-1); // 回退到page 2
page.go(-1); // 回退到page 1
page.go(2); // 前进到page 4
page.go(-2); // 后退到page 1

page.flush(); // 停止记录 清除page变更历史
```
### 类型支持

⚡️强烈建议使用typescript

