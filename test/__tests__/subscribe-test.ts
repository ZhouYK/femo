import * as family from '../models/family';
import {gluer, subscribe} from "../../src";

describe('subscribe tests', () => {

  test('deps test, subscribe every updates of the state', () => {
    const callbackMock = jest.fn((state) => {
      return state;
    });
    // 监听papa的数据变化
    // @ts-ignore
    const unsubscribe = subscribe([family.papa], callbackMock);
    // 注册时，就会执行一次
    expect(callbackMock.mock.calls.length).toBe(1);
    // 变更mama的数据
   family.mama({
      age: 5
    });
    expect(callbackMock.mock.calls.length).toBe(1); // papa未改变，不触发更新

    family.papa({
      name: '小桂子',
    }); // 触发更新
    expect(family.papa().name).toEqual('小桂子');
    expect(callbackMock.mock.calls.length).toBe(2); // 触发了一次更新

    expect(callbackMock.mock.calls[1][0]).toBe(family.papa());

    family.papa({
      name: '蓝精灵'
    });
    expect(family.papa().name).toBe('蓝精灵');
    expect(callbackMock.mock.calls.length).toBe(3);
    // 解绑监听
    unsubscribe();

    family.papa({
      name: '红蜻蜓',
    });
    expect(family.papa().name).toBe('红蜻蜓');
    expect(callbackMock.mock.calls.length).toBe(3); // 次数并没有增加，说明解绑成功

    // 重新做一次监听
    const anotherMockCall = jest.fn((state) => {
      return state;
    });
    // 空数组依赖 empty deps array
    const anotherUnsub = subscribe([], anotherMockCall); // 空数组依赖监听，本身在内部不会被绑定，所以就没有解绑
    const nameBefore = family.name();
    family.name('红蜻蜓');

    anotherUnsub(); // 可以不调用
    expect(nameBefore).toBe('张三');
    expect(family.name()).toBe('蓝色的红蜻蜓');

    expect(anotherMockCall.mock.calls.length).toBe(1); // 由于deps是空数组，所以后续不更新

    const thirdMockCall = jest.fn((state) => {
      return state;
    });
    const thirdUnsub = subscribe([family.name], thirdMockCall);

    family.name('红蜻蜓');
    expect(thirdMockCall.mock.calls.length).toBe(1); // 相同的数据，所以不会触发更新

    family.name('小宝');
    const state_1 = family.name();
    family.name('小天');
    const state_2 = family.name();

    expect(thirdMockCall.mock.calls.length).toBe(3);
    expect(thirdMockCall.mock.calls[1][0]).toBe(state_1);
    expect(thirdMockCall.mock.calls[2][0]).toBe(state_2);

    family.name('天宝');

    expect(thirdMockCall.mock.calls.length).toBe(4);

    // 解绑监听
    thirdUnsub();
    family.name('天线');

    expect(family.name()).toBe('蓝色的天线'); // 处理函数加上了'蓝色的'
    expect(thirdMockCall.mock.calls.length).toBe(4); // 还是4次，与解绑前一样。说明解绑成功
  });

  test('silent test', () => {
    const basic = gluer(null);
    const mockCall = jest.fn((data) => {
      return data;
    });
    const unsub = subscribe([basic], mockCall, false);

    basic('测试');
    expect(mockCall.mock.calls.length).toBe(1);
    expect(mockCall.mock.results[0].value).toBe('测试');
    expect(basic()).toBe('测试');
    basic.silent('123');
    expect(mockCall.mock.calls.length).toBe(1);
    expect(mockCall.mock.results.length).toBe(1);
    expect(basic()).toBe('123');
    unsub();
  });

  test('multiple callbacks', () => {
    const test = gluer(1);
    const deps = [test];

    const mockCall_1 = jest.fn((data) => data);
    const mockCall_2 = jest.fn((data) => data);
    const unsubscribe_1 = subscribe(deps, mockCall_1, false);
    const unsubscribe_2 = subscribe(deps, mockCall_2, false);
    subscribe(deps, mockCall_2, false);
    test(3);
    expect(mockCall_1.mock.calls.length).toBe(1);
    expect(mockCall_2.mock.calls.length).toBe(1);
    unsubscribe_1();
    test(4);
    expect(mockCall_1.mock.calls.length).toBe(1);
    expect(mockCall_2.mock.calls.length).toBe(2);
    unsubscribe_2();
    test(5);
    expect(mockCall_1.mock.calls.length).toBe(1);
    expect(mockCall_2.mock.calls.length).toBe(2);

  })
});
