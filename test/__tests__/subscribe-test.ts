import femo from '../../src';
import family from '../models/family';

describe('subscribe tests', () => {

  test('no deps array or empty deps array, subscribe every updates of the state', () => {
    const store = femo({
      family
    });
    const callbackMock = jest.fn((state) => {
      return state;
    });
    // 无数组依赖 no deps array,默认依赖整个state
    const unsubscribe = store.subscribe(callbackMock);
    // 注册时，就会执行一次
    expect(callbackMock.mock.calls.length).toBe(1);
    // family里面没有做count的更新处理，state不会改变
    store.model.family({
      count: 5
    });
    expect(callbackMock.mock.calls.length).toBe(1); // state未改变，不触发更新

    store.model.family.papa.name('小桂子'); // 触发更新
    expect(store.referToState(store.model.family.papa.name)).toBe('蓝色的小桂子');
    expect(callbackMock.mock.calls.length).toBe(2); //
    expect(callbackMock.mock.calls[1][0]).toBe(store.referToState(store.model));

    store.model.family.papa.name('蓝精灵');
    expect(store.referToState(store.model.family.papa.name)).toBe('蓝色的蓝精灵');
    expect(callbackMock.mock.calls.length).toBe(3);
    // 解绑监听
    unsubscribe();

    store.model.family.papa.name('红蜻蜓');
    expect(store.referToState(store.model.family.papa.name)).toBe('蓝色的红蜻蜓');
    expect(callbackMock.mock.calls.length).toBe(3); // 次数并没有增加，说明解绑成功

    // 重新做一次监听
    const anotherMockCall = jest.fn((state) => {
      return state;
    });
    // 空数组依赖 empty deps array
    const anotherUnsub = store.subscribe([], anotherMockCall);
    const nameBefore = store.referToState(store.model.family.papa.name);
    store.model.family.papa.name('红蜻蜓');
    expect(store.referToState(store.model.family.papa.name)).toBe(nameBefore); // 数据一样
    expect(anotherMockCall.mock.calls.length).toBe(1); // 不更新

    store.model.family.papa.name('小宝');
    const state_1 = store.referToState(store.model);
    store.model.family.papa.name('小天');
    const state_2 = store.referToState(store.model);

    expect(anotherMockCall.mock.calls.length).toBe(3);
    expect(anotherMockCall.mock.calls[1][0]).toBe(state_1);
    expect(anotherMockCall.mock.calls[2][0]).toBe(state_2);

    store.model.family.papa.name('天宝');

    expect(anotherMockCall.mock.calls.length).toBe(4);

    // 解绑监听
    anotherUnsub();
    store.model.family.papa.name('天线');

    expect(store.referToState(store.model.family.papa.name)).toBe('蓝色的天线'); // 处理函数加上了'蓝色的'
    expect(anotherMockCall.mock.calls.length).toBe(4); // 还是4次，与解绑前一样。说明解绑成功
  });

  test('have a non-empty deps array，subscribe the updates of the deps', () => {
    const store = femo({
      family
    });

    const subMock_1 = jest.fn((papa, mama) => {
      console.log(papa, mama);
    });
    // 第一次监听
    const unsub_1 = store.subscribe([store.model.family.papa, store.model.family.mama], subMock_1);
    store.model.family.papa.name('小金鱼');
    const papa_1 = store.referToState(store.model.family.papa);
    const mama_1 = store.referToState(store.model.family.mama);
    store.model.family.mama.name('小鲤鱼');
    const papa_2 = store.referToState(store.model.family.papa);

    const mama_2 = store.referToState(store.model.family.mama);

    expect(store.referToState(store.model.family.papa.name)).toBe('蓝色的小金鱼');

    expect(store.referToState(store.model.family.mama.name)).toBe('蓝色的小鲤鱼');

    expect(subMock_1.mock.calls.length).toBe(3); // 注册监听的时候就会执行一次
    expect(subMock_1.mock.calls[1][0]).toBe(papa_1);
    expect(subMock_1.mock.calls[1][1]).toBe(mama_1);

    expect(subMock_1.mock.calls[2][0]).toBe(papa_2);
    expect(subMock_1.mock.calls[2][1]).toBe(mama_2);

    expect(Object.is(papa_1, papa_2)).toBe(true);
    expect(Object.is(mama_1, mama_2)).toBe(false);

    unsub_1();

    store.model.family.mama.name('小仙女');
    expect(store.referToState(store.model.family.mama.name)).toBe('蓝色的小仙女');
    expect(subMock_1.mock.calls.length).toBe(3); // 解绑成功

  });

});
