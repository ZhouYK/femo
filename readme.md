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

### 核心思想

数据以独立的节点形式存在，没有中心存储，完全是散状分布的。

### <a href="#tool-function">工具函数</a>

- <a href="#gluer">gluer</a>
- <a href="#subscribe">subscribe</a>
- <a href="#genRaceQueue">genRaceQueue</a>

### <a href="#react-hook">react hook</a>

- <a href="#useModel">useModel</a>
- <a href="#useIndividualModel">useIndividualModel</a>
- <a href="#useDerivedState">useDerivedState</a>
- <a href="#useDerivedStateWithModel">useDerivedStateWithModel</a> 
- <a href="#useDerivedStateToModel">useDerivedStateToModel</a>
- <a href="#useDerivedModel">useDerivedModel</a>
- <a href="#useBatchDerivedModel">useBatchDerivedModel</a>
- <a href="#useBatchDerivedStateToModel">useBatchDerivedStateToModel</a>

### <a href="#HOC">HOC</a>

- <a href="#Inject">Inject</a>

### <a href="#methods">节点方法</a>

- <a href="#relyOn">relyOn</a>
- <a href="#relyOff">relyOff</a>
- <a href="#onChange">onChange</a>
- <a href="#offChange">offChange</a>
- <a href="#silent">silent</a>
- <a href="#track">track</a>
- <a href="#flush">flush</a>
- <a href="#go">go</a>
- <a href="#race">race</a>
- <a href="#preTreat">preTreat</a>
- <a href="#cache">cache</a>
- <a href="#cacheClean">cacheClean</a>

## <span id="tool-function">工具函数</span>

## <span id="gluer">gluer</span>

> 定义数据节点

#### 数据节点定义：
```js
import { gluer } from 'femo';

const name = gluer('初始名字');

```
节点数据可以使任意类型。一旦定义，节点的数据类型就确定了，后续不能改变。数据类型不变性只是用了typescript的类型做约束，请遵守这一约束，让数据更清晰和可预测。

#### 数据更新：
```js
  name('张三');
```

#### 数据获取
```js
  name(); // 张三
```

#### 不同的入参更新数据

同步函数
```js
  name((data, state) => {
    return '李四';
  });
```

异步函数
```js
  name(async (data, state) => {
    return '王二';
  });
```
当入参是异步函数的时候，数据节点会异步地去更新数据。

## <span id="subscribe">subscribe</span>
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

## genRaceQueue
> 数据节点更新出现竞争时，需要确保当前的数据正确。

什么是竞争？

常见的，先后发送了两个请求p1和p2，p1和p2都有各自的异步回调处理逻辑。一般情况下，先发出去的请求先回来，后发出去的请求后回来。 这种情况下异步回调的处理逻辑的先后顺序是符合预期的。

但存在另外的情况，p1请求先发送后返回，p2请求后发送先返回。那么异步回调的处理顺序就不再是 p1的异步回调 => p2的异步回调，而是 p2的异步回调 => p1的异步回调。这种执行顺序显然是不符合预期的，会导致问题。

genRaceQueue就是解决这种数据可能不一致的问题的。

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
<strong>数据节点自身也提供了处理竞争的方法<a href="#race">race</a>。很多时候可以通过<a href="#race">race</a>方法来简化上面<a href="#genRaceQueue">genRaceQueue</a>的使用。</strong>

## <span id="react-hook">react hook</span>

react hook返回的model都是经过包装的，不要对其进行订阅，订阅了不会有效果。

## <span id="useModel">useModel</span>
> 自定义hook，用于消费节点数据

用react hook的方式订阅并获取数据节点的内容


useModel(model, [deps], [options]);

|入参    |含义     |
| :----  | :----  |
| model  | (必传)gluer定义的数据 |
| deps   | (可选)依赖的service数组。[service], service为返回model所需数据的函数，该函数会被注入当前model的值，可返回Promise |
| onChange | (可选)数据发生变化时，执行的回调。onChange: (nextState, prevState) => void;
| <a href="#options">options</a> | (可选)一些配置。{ suspenseKey?: string; cache?: boolean; } |


```typescript

interface List {
  page: number;
  size: number;
  list: any[];
}
// 定义一个节点
const listModel = gluer<List>({ page: 1, size: 20, total: 0, list: [] });

const [query] = useState({
  pageIndex: 1,
  pageSize: 20,
});

const getList = useCallback(() => {
  return get('/api/list', query).then((res) => res.data);
}, []);
// 在函数组件中使用useModel消费数据
// clonedListModel是对listModel的克隆，clonedListModel本质上是对listModel的一层包装，底层使用的是listModel，所以核心还是listModel。
// loading状态是clonedListModel带来的，用于表明异步更新时数据的加载状态

// getList用于获取数据，getList的每一次变化都会触发去远端拉取数据
// suspenseKey 有值了，会开启suspense模式，上层组件中需要有Suspense组件包裹
const [listData, clonedListModel, { loading }] = useModel(listModel, [getList], {
  suspenseKey: 'list',
});

// 每次list的变动都会通知useModel，useModel更新listData，rerender组件
// 和useState很类似

```

## <span id="useIndividualModel">useIndividualModel</span>
> 和useModel类似，只是不再依赖外部传入model，而是内部生成一个跟随组件生命周期的model。

useIndividualModel(initState, [deps], [options])

|入参    |含义     |
| :----  | :----  |
| initState  | (必传)可为函数 |
| deps   | (可选)依赖的service数组。[service], service为返回生成model所需数据的函数，该函数会被注入当前model的值，可返回Promise |
| onChange | (可选)数据发生变化时，执行的回调。onChange: (nextState, prevState) => void;
| <a href="#options">options</a> | (可选)一些配置。{ suspenseKey?: string; cache?: boolean; } |

```typescript
const [query] = useState({
  pageIndex: 1,
  pageSize: 20,
});

const getList = useCallback(() => {
  return get('/api/list', query).then((res) => res.data);
}, []);

// 和useModel一致，除了返回参数里面多了一个生成的model节点，这里就是listModel
const [listData, listModel, clonedListModel, { loading }] = useIndividualModel({
  page: 1,
  size: 20,
  list: [],
}, [getList], {
  suspenseKey: 'list',
});

// 每次list的变动都会通知useModel，useModel更新listData，rerender组件
// 和useState很类似

```

## 处理衍生数据

### 比较逻辑由hook处理，类似useEffect
### <span id="useDerivedState">useDerivedState</span>
> 生成衍生数据，并返回model。区别于 useDerivedModel、useBatchDerivedModel，其依赖是个数组，处理更像useEffect

依赖中可以有model，会监听model的变化（model.silent的更新不会通知）

### <span id="useDerivedStateWithModel">useDerivedStateWithModel</span>
> 将依据其他数据产生的衍生数据更新到model中去，统一使用model的数据。区别于 useDerivedStateToModel、useBatchDerivedStateToModel，其依赖是个数组，处理更像useEffect

依赖中可以有model，会监听model的变化（model.silent的更新不会通知）

### 比较逻辑由用户代码处理，类似类组件中的getDerivedStateFromProps
### <span id="useDerivedStateToModel">useDerivedStateToModel</span>
> 将依据其他数据产生的衍生数据更新到model中去，统一使用model的数据
> 和react组件中[getDerivedStateFromProps](https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops) 功能一致。
> useDerivedStateToModel更具泛用性，不仅限于props，而是一切被依赖的数据都可以通过这个方法来处理衍生数据

主要使用场景为：想要使用model的能力，但不希望model是全局共享的。（在可复用组件里面数据共享可能会造成一些问题，这时就期望数据是独立的）

### <span id="useDerivedModel">useDerivedModel</span>
> 结合了useIndividualModel和useDerivedStateToModel

在实际运用中发现，如果要使用useDerivedStateToModel，经常会先用useIndividualModel创建一个model。索性就把二者合成一个，方便使用

### <span id="useBatchDerivedStateToModel">useBatchDerivedStateToModel</span>
> 是useDerivedStateToModel的扩展版，可以一次处理很多衍生数据依赖

### <span id="useBatchDerivedModel">useBatchDerivedModel</span>
> 结合了useIndividualModel和useBatchDerivedStateToModel


## <span id="HOC">HOC</span>

## <a id="Inject">Inject</a>

Inject会向组件注入一些属性，目前(v1.10.1)会向组件注入：

| 属性名 | 含义 |
| :----  | :----  |
| suspenseKeys | 一组唯一的key。类型为string[]。用于<a href="#options">options</a>中的suspenseKey，保证suspenseKey的唯一性。 |

## <span id="methods">节点方法</span>

## <a id="relyOn">relyOn</a>
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
  const newState = { ...state };
  return newState;
});

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
const a = gluer('');
const b = gluer('');

a.relyOn([b], (data, state) => {
  // todo
});

b.relyOn([a], (data, state) => {
  // todo
})
```
以上情况应该避免，太容易引起死循环😢！

## <a id="relyOff">relyOff</a>

解绑节点上所有的依赖监听

```javascript
const a = gluer('');
a.relyOff();
```

## <a id="#onChange">onChange</a>

节点数据发生变化时会执行通过该方法传入的回调函数

| 入参 | 含义 |
| :---- | :---- |
| callback函数(必填) | 节点数据发生变化时会执行的回调 |

```javascript
const model = gluer('');

model.onChange((state) => { console.log(state) });

```

这个方法用于需要节点主动向外发布数据的场景。

## <a id="#offChange">offChange</a>

解除通过onChange注册的回调

| 入参 | 含义 |
| :---- | :---- |
| callback函数（可选） | 注册的回调 |

```javascript
const model = gluer('');

const callback = (state) => {
  console.log(state);
};

model.onChange(callback);

model.offChange(callback);

model.offChange(); // 解除节点上所有通过onChange注册的回调函数
```

## <a id="silent">silent</a>
> 静默地更新数据节点的内容

该方法和直接使用节点更新内容一样，只是不会进行数据更新的广播，订阅了该数据的回调函数或者组件不会在此次更行中被执行或者重新渲染。
在需要优化组件渲染频率的时候可以考虑使用它。

上面<a href="#useDerivedStateToModel">useDerivedStateToModel</a>内部就调用了silent方法。
这方法感觉还挺有用的😁。

```js
const [, casesModel] = useIndividualModel < Flow.Case[] > (node.switch_case || []);
const [cases] = useDerivedStateToModel(props, casesModel, (nextProps, prevProps, state) => {
  if (nextProps.node !== prevProps.node) {
    return nextProps.node.switch_case || [];
  }
  return state;
});
```

## <a id="track">track</a>
> 开始记录数据节点每次更新后的内容

节点开始记录数据节点每次更新后的内容，并把当前内容做为第一条记录。

```javascript
const page = gluer('page 1');
page.track(); // 开始记录 page的变更历史
```
## <a id="flush">flush</a>
 > 清除记录，并停止记录

节点停止记录状态历史，并把记录的状态历史清空。和track搭配使用

```javascript
const page = gluer('page 1');
page.track(); // 开始记录 page的变更历史
// 中间省略若干代码
page.flush(); // 停止记录 清除page变更历史
```
## <a id="go">go</a>
> 将数据节点的内容更新为指定记录内容

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

## <a id="race">race</a>
> 处理数据节点更新出现的竞争问题

简化上面<a href="#genRaceQueue">genRaceQueue</a>的例子
```js
// p1请求
someModel.race(params, async (data, state) => {
  return await fetchRemote(data);
});
// p2请求
someModel.race(async (data, state) => { return await fetchRemote() })
```

## <a id="preTreat">preTreat</a>
> 预处理数据，可得到结果而不更新节点

此方法可能用于一些依据处理结果来做条件判断的场景

## <a id="cache">cache</a>
> 缓存异步数据，使用方式同race，因为内部调用的<a href="#race">race</a>方法。详情见[issue#31](https://github.com/ZhouYK/femo/issues/31)

## <a id="cacheClean">cacheClean</a>
> 清除异步数据的缓存

## 补充说明

### <a id='options'>options</a>

#### suspenseKey
字符串类型。如果传入了非空的字符串，则表示开启Suspense模式，需要和Suspense组件配合使用。尽量保证不会出现两个相同的suspenseKey。可以使用<a href='#Inject'>Inject</a>高阶函数来为组件注入suspenseKey，可以省去自定义suspenseKey的工作。

#### cache
布尔类型。true代表开启异步缓存，false代表关闭异步缓存。开启异步缓存的含义是：一旦开启，则后续所有对数据的异步更新都将以第一次成功更新的异步数据为结果。具体一些开启异步缓存后，第一次异步更新成功的数据会被缓存下来；后续再进行异步更新，数据将保持不变。

可以通过节点方法<a href='#cacheClean'>cacheClean</a>清除缓存数据。

cache一般适用于数据本身使用范围广（或者数据所在的组件使用范围广）、对数据的实时性不敏感的场景。具体含义<a href="#cache">详见</a>

#### onChange

形如 (nextState, prevState) => void 

当数据发生变更时向外发布信息。


## 类型支持

⚡️强烈建议使用typescript

