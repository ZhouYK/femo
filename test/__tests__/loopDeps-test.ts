import gluer from '../../src/gluer';

describe('loop dependencies test', () => {
  test('relyOn', () => {
    const callback_mock = jest.fn(() => {});
    const a = gluer(0);
    a.relyOn([a], ([aData]) => {
      callback_mock();
      return aData + 1;
    });
    expect(callback_mock.mock.calls.length).toBe(0);
    expect(a()).toBe(0);
    a(1);
    expect(callback_mock.mock.calls.length).toBe(1);
    expect(a()).toBe(1);

    const b = gluer(1);
    const c = gluer(2);
    const d = gluer(3);
    const e = gluer(4);
    const callback_mock_1 = jest.fn(() => {});
    b.relyOn([e], ([eData]) => {
      console.log('b');
      callback_mock_1();
      return eData + 1;
    });

    c.relyOn([b], ([bData]) => {
      console.log('c');
      callback_mock_1();
      return bData + 1;
    })
    d.relyOn([c], ([cData]) => {
      console.log('d', c());
      callback_mock_1();
      return cData + 1;
    });
    e.relyOn([d], ([dData]) => {
      console.log('e');
      callback_mock_1();
      return dData + 1;
    });

    expect(b()).toBe(1);
    expect(c()).toBe(2);
    expect(d()).toBe(3);
    expect(e()).toBe(4);

    b(5);
    expect(b()).toBe(5);
    expect(c()).toBe(6);
    expect(d()).toBe(7);
    expect(e()).toBe(8);

    expect(callback_mock_1.mock.calls.length).toBe(4);

    const f = gluer(9);

    f.relyOn([e], ([eData]) => {
      console.log('f');
      callback_mock_1();
      c(99); // 如果调用链中包含了c，则更新不会生效；如果调用链条没有包含c，则更新会生效;
      return eData + 1;
    });
    expect(f()).toBe(9);

    b(10);
    // 调用链条已包含c
    expect(b()).toBe(10);
    expect(c()).toBe(11);
    expect(d()).toBe(12);
    expect(e()).toBe(13);
    expect(f()).toBe(14); // f注册的回调里面c(99)不生效
    expect(c()).toBe(11);
    expect(callback_mock_1.mock.calls.length).toBe(9);

    console.log('start');
    d(15);
    // 调用链条未包含c
    expect(d()).toBe(15);
    expect(e()).toBe(16);
    expect(f()).toBe(17); // f注册的回调里面c(99)会生效
    expect(c()).toBe(99);
    expect(b()).toBe(17);
    expect(d()).toBe(15); // d循环依赖了，并不会更新

    expect(callback_mock_1.mock.calls.length).toBe(15);
  })
})
