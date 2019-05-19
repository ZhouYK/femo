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
    // 无数组依赖 no deps array
    // @ts-ignore
    const unsubscribe = store.subscribe(callbackMock);

    // @ts-ignore
    store.model.family({
      count: 5
    });
    expect(callbackMock.mock.calls.length).toBe(0); // state未变，不触发更新
    // @ts-ignore
    store.model.family.papa.name('小桂子');

    // @ts-ignore
    expect(store.referToState(store.model.family.papa.name)).toBe('蓝色的小桂子');
    expect(callbackMock.mock.calls.length).toBe(1);
    // @ts-ignore
    expect(callbackMock.mock.calls[0][0]).toBe(store.referToState(store.model));

    // @ts-ignore
    store.model.family.papa.name('蓝精灵');
    // @ts-ignore
    expect(store.referToState(store.model.family.papa.name)).toBe('蓝色的蓝精灵');
    expect(callbackMock.mock.calls.length).toBe(2);
    // 解绑监听
    unsubscribe();

    // @ts-ignore
    store.model.family.papa.name('红蜻蜓');
    // @ts-ignore
    expect(store.referToState(store.model.family.papa.name)).toBe('蓝色的红蜻蜓');
    expect(callbackMock.mock.calls.length).toBe(2); // 次数并没有增加，说明解绑成功

    // 重新做一次监听
    // @ts-ignore
    const anotherMockCall = jest.fn((state) => {
      return state;
    });
    // 空数组依赖 empty deps array
    // @ts-ignore
    const anotherUnsub = store.subscribe([], anotherMockCall);
    // @ts-ignore
    const nameBefore = store.referToState(store.model.family.papa.name);
    // @ts-ignore
    store.model.family.papa.name('红蜻蜓');
    // @ts-ignore
    expect(store.referToState(store.model.family.papa.name)).toBe(nameBefore); // 数据一样
    expect(anotherMockCall.mock.calls.length).toBe(0); // 不更新

    // @ts-ignore
    store.model.family.papa.name('小宝');
    // @ts-ignore
    const state_1 = store.referToState(store.model);
    // @ts-ignore
    store.model.family.papa.name('小天');
    // @ts-ignore
    const state_2 = store.referToState(store.model);

    expect(anotherMockCall.mock.calls.length).toBe(2);
    expect(anotherMockCall.mock.calls[0][0]).toBe(state_1);
    expect(anotherMockCall.mock.calls[1][0]).toBe(state_2);

    // @ts-ignore
    store.model.family.papa.name('天宝');

    expect(anotherMockCall.mock.calls.length).toBe(3);

    // 解绑监听
    anotherUnsub();
    // @ts-ignore
    store.model.family.papa.name('天线');

    // @ts-ignore
    expect(store.referToState(store.model.family.papa.name)).toBe('蓝色的天线'); // 处理函数加上了'蓝色的'
    expect(anotherMockCall.mock.calls.length).toBe(3); // 还是3次，与解绑前一样。说明解绑成功
  });

  test('have a non-empty deps array，subscribe the updates of the deps', () => {
    const store = femo({
      family
    });

    const subMock_1 = jest.fn((papa, mama) => {
      console.log(papa, mama);
    });
    // 第一次监听
    // @ts-ignore
    const unsub_1 = store.subscribe([store.model.family.papa, store.model.family.mama], subMock_1);
    // @ts-ignore
    store.model.family.papa.name('小金鱼');
    // @ts-ignore
    const papa_1 = store.referToState(store.model.family.papa);
    // @ts-ignore
    const mama_1 = store.referToState(store.model.family.mama);
    // @ts-ignore
    store.model.family.mama.name('小鲤鱼');
    // @ts-ignore
    const papa_2 = store.referToState(store.model.family.papa);

    // @ts-ignore
    const mama_2 = store.referToState(store.model.family.mama);

    // @ts-ignore
    expect(store.referToState(store.model.family.papa.name)).toBe('蓝色的小金鱼');

    // @ts-ignore
    expect(store.referToState(store.model.family.mama.name)).toBe('蓝色的小鲤鱼');

    expect(subMock_1.mock.calls.length).toBe(2);
    expect(subMock_1.mock.calls[0][0]).toBe(papa_1);
    expect(subMock_1.mock.calls[0][1]).toBe(mama_1);

    expect(subMock_1.mock.calls[1][0]).toBe(papa_2);
    expect(subMock_1.mock.calls[1][1]).toBe(mama_2);

    expect(Object.is(papa_1, papa_2)).toBe(true);
    expect(Object.is(mama_1, mama_2)).toBe(false);

    unsub_1();

    // @ts-ignore
    store.model.family.mama.name('小仙女');
    // @ts-ignore
    expect(store.referToState(store.model.family.mama.name)).toBe('蓝色的小仙女');
    expect(subMock_1.mock.calls.length).toBe(2); // 解绑成功

  });

});
