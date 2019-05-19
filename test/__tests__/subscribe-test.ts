import femo from '../../src';
import family from '../models/family';

describe('subscribe tests', () => {

  test('subscribe every update of state', () => {
    const store = femo({
      family
    });
    const callbackMock = jest.fn((state) => {
      return state;
    });
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
    unsubscribe();

    // 重新做一次监听
    const anotherMockCall = jest.fn((state) => {
      return state;
    });
    // @ts-ignore
    const anotherUnsub = store.subscribe(anotherMockCall);
    // @ts-ignore
    const nameBefore = store.referToState(store.model.family.papa.name);
    // @ts-ignore
    store.model.family.papa.name('小桂子');
    // @ts-ignore
    expect(store.referToState(store.model.family.papa.name)).toBe(nameBefore); // 数据一样
    expect(anotherMockCall.mock.calls.length).toBe(0); // 不更新

    // @ts-ignore
    store.model.family.papa.name('小宝');
    // @ts-ignore
    store.model.family.papa.name('小天');

    expect(anotherMockCall.mock.calls.length).toBe(2);

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
  })

});
