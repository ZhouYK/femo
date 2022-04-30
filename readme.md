<a href="https://996.icu"><img src="https://img.shields.io/badge/link-996.icu-red.svg"></a>
[![Build Status](https://travis-ci.com/ZhouYK/femo.svg?branch=master)](https://travis-ci.com/ZhouYK/femo)
[![codecov](https://codecov.io/gh/ZhouYK/femo/branch/master/graph/badge.svg)](https://codecov.io/gh/ZhouYK/femo)
[![NPM version](https://img.shields.io/npm/v/femo.svg?style=flat)](https://www.npmjs.com/package/femo)
[![NPM downloads](http://img.shields.io/npm/dm/femo.svg?style=flat)](https://www.npmjs.com/package/femo)
![package size](https://img.shields.io/bundlephobia/minzip/femo.svg?style=flat)
![license](https://img.shields.io/github/license/ZhouYK/glue-redux.svg)
# femo

*拒绝反直觉，直观地管理数据*

## 当前版本是2.x.x版本，1.x.x版本请点击<a href="https://github.com/ZhouYK/femo/tree/v1.15.14">查看</a>    
## 安装 [![NPM version](https://img.shields.io/npm/v/femo.svg?style=flat)](https://www.npmjs.com/package/femo)

```bash
npm i femo
or
yarn add femo
```

---
## 在react中使用

方式一：先声明定义model，再在组件中使用

```js
// model.js
import { gluer } from 'femo';

const student = gluer({
  name: '',
  age: 0,
});

export default student;

```

```jsx
// Student组件
import { useModel } from 'femo';
import model from './model.js';

const Student = (props) => {
  const [student] = useModel(model);
  
  return (
    <section>
      <section>{ student.name }</section>
      <section>{ student.age }</section>
    </section>  
  )
}
export default Student;
```

方式二：直接在组件中声明定义并使用

```jsx
// Student组件
import { useIndividualModel } from 'femo';

const Student = (props) => {
  const [student, model] = useIndividualModel({
    name: '',
    age: 0,
  });
  
  return (
    <section>
      <section>{ student.name }</section>
      <section>{ student.age }</section>
    </section>  
  )
}
export default Student;
```

## 脱离react使用

脱离react后，就不能使用react hooks了

```js
import { gluer, subscribe } from 'femo';
const name = gluer('初始名字');

const unsubscribe = subscribe([name], (nameData) => { console.log(nameData) });
name('张胜男');
// 会打印 张胜男

// 取消监听。调用返回的函数即可
unsubscribe();
```

## 核心

数据之间轻耦合，数据本身具有完备的处理能力。

## API

### 核心函数

- <a href="#gluer">gluer</a>
- <a href="#subscribe">subscribe</a>
- <a href="#genRaceQueue">genRaceQueue</a>


### <span id="gluer">gluer</span>

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

### <span id="subscribe">subscribe</span>
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


### 节点方法

- <a href="#watch">watch（原来的relyOn）</a>
- <a href="#onChange">onChange</a>
- <a href="#silent">silent</a>
- <a href="#race">race</a>
- <a href="#preTreat">~~preTreat~~（2.0.0版本不再对外提供）</a>
- <a href="#offChange">~~offChange~~（2.0.0版本已删除）</a>
- <a href="#track">~~track~~（2.0.0版本已删除）</a>
- <a href="#flush">~~flush~~（2.0.0版本已删除）</a>
- <a href="#go">~~go~~（2.0.0版本已删除）</a>
- <a href="#relyOff">~~relyOff~~（2.0.0版本已删除）</a>
- <a href="#cache">~~cache~~（2.0.0版本已删除）</a>
- <a href="#cacheClean">~~cacheClean~~（2.0.0版本已删除）</a>

### <span id="watch">watch</span>
> 声明节点的依赖，并注册回调

适用的场景：多个数据节点的变化都可引起一个数据节点更新，多对一的关系。

```javascript
const demo1 = gluer(null);
const demo2 = gluer(null);
const demo3 = gluer(null);

const demo = gluer(null);

const unsubscribe = demo.watch([demo1, demo2, demo3], (data, state) => 
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

定义节点之间的单向依赖关系。

model.watch(models, callback)
入参返回如下：

| 入参           | 含义                                                                                |
|:-------------|:----------------------------------------------------------------------------------|
| models(必填)   | 模型数组，定义依赖的模型。放置的顺序会直接影响取值顺序                                                       |
| callback(必填) | 回调函数，形如(data, state) => state。data是模型值的数组，与模型数组一一对应。state 是当前模型的值。回调函数需要返回当前模型的新值 |

watch处理数据依赖更新是单向的。通常情况下适合处理结构上没有嵌套的彼此独立的模型。

需要注意的是，如果是要处理数据的双向依赖，比如：
```javascript
const a = gluer('');
const b = gluer('');

a.watch([b], (data, state) => {
  // todo
});

b.watch([a], (data, state) => {
  // todo
})
```

### <span id="#onChange">onChange</span>

节点数据发生变化时会执行通过该方法传入的回调函数

| 入参 | 含义 |
| :---- | :---- |
| callback函数(必填) | 节点数据发生变化时会执行的回调 |

```javascript
const model = gluer('');

model.onChange((state) => { console.log(state) });

```

这个方法用于需要节点主动向外发布数据的场景。

### <span id="silent">silent</span>
> 静默地更新数据节点的内容

该方法和直接使用节点更新内容一样，只是不会进行数据更新的广播，订阅了该数据的回调函数或者组件不会在此次更行中被执行或者重新渲染。
在需要优化组件渲染频率的时候可以考虑使用它。

```js
const [, casesModel] = useIndividualModel < Flow.Case[] > (node.switch_case || []);
const [cases] = useDerivedStateToModel(props, casesModel, (nextProps, prevProps, state) => {
  if (nextProps.node !== prevProps.node) {
    return nextProps.node.switch_case || [];
  }
  return state;
});
```

### <span id="race">race</span>
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

## 搭配React

### <span href="#react-hook">react hook</a>

- <a href="#useModel">useModel</a>
- <a href="#useIndividualModel">useIndividualModel</a>
- <a href="#useDerivedState">useDerivedState</a>
- <a href="#useDerivedModel">useDerivedModel</a>
- <a href="#useBatchDerivedModel">useBatchDerivedModel</a>
- <a href="#useDerivedStateToModel">~~useDerivedStateToModel~~（2.0.0版本不再对外提供）</a>
- <a href="#useDerivedStateWithModel">~~useDerivedStateWithModel~~（2.0.0版本不再对外提供）</a>
- <a href="#useException">~~useException~~（2.0.0版本不再对外提供）</a>
- <a href="#useBatchDerivedStateToModel">~~useBatchDerivedStateToModel~~（2.0.0版本不再对外提供）</a>

react hook返回的model都是经过包装的，不要对其进行订阅，订阅了不会有效果。

## <span id="useModel">useModel</span>
> 自定义hook，用于消费节点数据

用react hook的方式订阅并获取数据节点的内容


2.0.0版本之前：useModel(model, [deps], [options]);


|入参    | 含义                                                                         |
| :----  |:---------------------------------------------------------------------------|
| model(必传)  | gluer定义的模型                                                                 |
| deps(可选)   | 依赖的service数组，形如[service]. service是更新model的函数，形如 (state: S) => S / Promise\<S> |
| <a href="#options">options(可选)</a> | 一些配置                                                                       |


2.0.0版本： useModel(model, service, deps, options);

| 入参                                 | 含义                                |
|:-----------------------------------|:----------------------------------|
| model(必传)                          | gluer定义的模型                        |
| service(可选)                        | 形如: (state: S) => S \ Promise\<S> |
| deps(可选)                           | 依赖数组，如有变化会去执行service更新model数据     |        
| <a href="#options">options(可选)</a> | 一些配置 |


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

// 2.0.0版本之前
// getList用于获取数据，getList的每一次变化都会触发去远端拉取数据
// suspenseKey 有值了，会开启suspense模式，上层组件中需要有Suspense组件包裹
const getList = useCallback(() => {
  return get('/api/list', query).then((res) => res.data);
}, [query]);

const [listData, listModelWithStatus, { loading, successful }] = useModel(listModel, [getList], {
  suspenseKey: 'list',
});

// 2.0.0版本
// 不再依赖getList的变化去触发更新，而是直接依赖变化的条件
const getList = () => {
  return get('/api/list', query).then((res) => res.data);
};

const [listData, listModelWithStatus, { loading, successful }] = useModel(listModel, getList, [query], {
  suspenseKey: 'list',
});

// 每次list的变动都会通知useModel，useModel更新listData，rerender组件
// 和useState很类似

```

## <span id="useIndividualModel">useIndividualModel</span>
> 和useModel类似，只是不再依赖外部传入model，而是内部生成一个跟随组件生命周期的model。

2.0.0版本之前：useIndividualModel(initState, deps, options)

|入参    | 含义                                                                            |
| :----  |:------------------------------------------------------------------------------|
| initState(必传)  | 可为函数                                                                          |
| deps(可选)   | 依赖的service数组，形如[service]. service是更新model的函数，形如 (state: S) => S / Promise\<S> |
| <a href="#options">options(可选)</a> | 一些配置                                                                          |

2.0.0版本之后：useIndividualModel(initState, service, deps, options)

| 入参                                 | 含义                                             |
|:-----------------------------------|:-----------------------------------------------|
| initState(必传)                      | 可为函数， S / () => S                              |
| service(可选)                        | 用于更新model的函数，形如 (state: S) => S / Promise\<S>; |
| deps(可选)                           | 依赖数组，更新会驱动service更新model                       |
| <a href="#options">options(可选)</a> | 一些配置                                           |

```typescript
const [query] = useState({
  pageIndex: 1,
  pageSize: 20,
});

// 2.0.0版本之前
const getList = useCallback(() => {
  return get('/api/list', query).then((res) => res.data);
}, [query]);

const [listData, listModel, listModelWithStatus, { loading, successful }] = useIndividualModel({
  page: 1,
  size: 20,
  list: [],
}, [getList], {
  suspenseKey: 'list',
});

// 2.0.0版本
const getList = () => {
  return get('/api/list', query).then((res) => res.data);
};
const [listData, listModel, listModelWithStatus, { loading, successful }] = useIndividualModel({
  page: 1,
  size: 20,
  list: [],
}, getList, [query], {
  suspenseKey: 'list',
});

```

## 处理衍生数据

### 比较逻辑由hook处理，类似useEffect
### <span id="useDerivedState">useDerivedState</span>
> 生成衍生数据，并返回model。区别于 useDerivedModel、useBatchDerivedModel，其依赖是个数组，处理更像useEffect

依赖中可以有model，会监听model的变化。

useDerivedState(initState, callback, deps)
或者
useDerivedState(callback, deps) // 此时callback充当initState，并且承担依赖变化更新model的职责

| 入参        | 含义                                        |
|:----------|:------------------------------------------|
| initState | S \ () => S                               |
| callback  | (state: S) => S。更新model的函数，还可以充当initState |
| deps      | 依赖数组                                      |
```javascript
const { count } = props;

const [value, valueModel, valueModelWithStatus, { loading, successful }] = useDerivedState(count, (s: number) => count, [count]);

// 其实可以简写为
const [value, valueModel, valueModelWithStatus, { loading, successful }] = useDerivedState((s: number) => count, [count]);

```

### 比较逻辑由用户代码处理，类似类组件中的getDerivedStateFromProps
### <span id="useDerivedModel">useDerivedModel</span>
> 将依据其他数据产生的衍生数据更新到model中去，统一使用model的数据
> 和react组件中[getDerivedStateFromProps](https://reactjs.org/docs/react-component.html#static-getderivedstatefromprops) 功能一致。
> useDerivedStateToModel更具泛用性，不仅限于props，而是一切被依赖的数据都可以通过这个方法来处理衍生数据

useDerivedModel(initState, source, callback)

| 入参        | 含义                                                                         |
|:----------|:---------------------------------------------------------------------------|
| initState | 初始值，形如: S \ () => S                                                        |
| source    | 衍生来源                                                                       |
| callback  | 形如：(nextSource, prevSource, state: S) => S，根据前后两次记录的衍生来源，结合当前state，更新model |
```javascript

const [value, valueModel, valueModelWithStatus, {  loading, successful }] = useDerivedModel(props.defaultValue ?? 0, props, (nextSource, prevSource, state) => {
  if (nextSource !== prevSource) {
    if ('value' in nextSource) {
      return nextSource.value;
    }
  } 
  return state;
})

```

### <span id="useBatchDerivedModel">useBatchDerivedModel</span>
> useDerivedModel只能处理单一的衍生来源，useBatchDerivedModel则可以处理任意多衍生来源

useBatchDerivedModel(initState, {
    source: source_1,
    callback: (nextSource, prevSource, state, )
})



### <span href="#HOC">HOC</a>

- <a href="#Inject">Inject</a>

### <span id="Inject">Inject</a>

Inject会向组件注入一些属性，目前(v1.10.1)会向组件注入：

| 属性名 | 含义 |
| :----  | :----  |
| suspenseKeys | 一组唯一的key。类型为string[]。用于<a href="#options">options</a>中的suspenseKey，保证suspenseKey的唯一性。 |

## 补充说明

### <span id='options'>options</a>

#### ~~suspenseKey~~(2.0.0已被标记为deprecated)
字符串类型。如果传入了非空的字符串，则表示开启Suspense模式，需要和Suspense组件配合使用。尽量保证不会出现两个相同的suspenseKey。可以使用<a href='#Inject'>Inject</a>高阶函数来为组件注入suspenseKey，可以省去自定义suspenseKey的工作。

#### suspense
```typescript
export interface SuspenseOptions {
  key: string; // 等同于suspenseKey，唯一，一旦确定就不要变动，否则会有意外
  persist?: boolean; // 默认false。false：只在第一次渲染时使用suspense能力；true：一直使用suspense能力
}
```

#### onChange

形如 (nextState, prevState) => void 

当数据发生变更时向外发布信息。

#### control

> GluerReturn<{ loading: boolean; successful: boolean; key?: string; data?: any; }>


必须是由gluer定义的model。用来控制 useModel 和 useIndividualModel 返回的status，以及在首次组件渲染禁止调用service。

其中key是control的标识，消费control的业务代码可以根据key值来决定是否使用control的数据和状态。

需要说明的是：如果传入了control model，组件首次渲染时不会调用service；control model会一直控制useModel和useIndividualModel
返回的status，直到调用service进行了一次异步更新(注意是异步更新，同步更新不会解除control model的控制)。


### 循环依赖

一旦发现在模型的调用链中出现了循环，会在那个点终止，在代码层面表现为直接返回。终止点不会执行更新逻辑，终止以前的调用不受影响。
模型在异步回调函数中的每一次调用都会被视为一次调用链的起始。也就是在说异步回调进行模型调用更新，不会记录之前的调用栈。


## 类型支持

⚡️强烈建议使用typescript

