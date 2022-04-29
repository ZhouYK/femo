import subscribe from '../../src/subscribe';
import gluer from '../../src/gluer';
describe('loop dependencies test', () => {
  test('watch', () => {
    const callback_mock = jest.fn(() => {});
    const a = gluer(0);
    a.watch([a], ([aData]) => {
      callback_mock();
      return aData + 1;
    });
    expect(callback_mock.mock.calls.length).toBe(0);
    expect(a()).toBe(0);
    a(1);
    expect(callback_mock.mock.calls.length).toBe(0);
    expect(a()).toBe(1);

    const b = gluer(1);
    const c = gluer(2);
    const d = gluer(3);
    const e = gluer(4);
    const callback_mock_1 = jest.fn(() => {});
    b.watch([e], ([eData]) => {
      callback_mock_1();
      return eData + 1;
    });

    c.watch([b], ([bData]) => {
      callback_mock_1();
      return bData + 1;
    })
    d.watch([c], ([cData]) => {
      callback_mock_1();
      return cData + 1;
    });
    e.watch([d], ([dData]) => {
      callback_mock_1();
      return dData + 1;
    });

    expect(b()).toBe(1);
    expect(c()).toBe(2);
    expect(d()).toBe(3);
    expect(e()).toBe(4);

    b(5);
    // 调用链 b -> c -> d -> e -> b
    expect(b()).toBe(5);
    expect(c()).toBe(6);
    expect(d()).toBe(7);
    expect(e()).toBe(8);

    expect(callback_mock_1.mock.calls.length).toBe(3);

    const f = gluer(9);

    f.watch([e], ([eData]) => {
      callback_mock_1();
      c(99); // 如果调用链中包含了c，则更新不会生效；如果调用链条没有包含c，则更新会生效;
      return eData + 1;
    });
    expect(f()).toBe(9);

    b(10);
    // 调用链条已包含c
    // 调用链有两条
    // 1，b -> c -> d -> e -> b
    // 2，b -> c -> d -> e -> f -> c
    expect(b()).toBe(10);
    expect(c()).toBe(11);
    expect(d()).toBe(12);
    expect(e()).toBe(13);
    expect(f()).toBe(14); // f注册的回调里面c(99)不生效
    expect(c()).toBe(11);
    expect(callback_mock_1.mock.calls.length).toBe(7);

    d(15);
    // 调用链条未包含c
    // 有两条调用链：
    // 1，d -> e -> b -> c -> d
    // 2，d -> e -> f -> c -> d
    // d都是终点并不会更新，只会执行回调（这里设计上不应该执行回调，原因在下面），c调用更新两次是合理的：因为在不同的链中
    // 需要考虑的是：终点是否应该执行回调？答案：不应该，因为回调里面可能有副作用
    expect(d()).toBe(15);
    expect(e()).toBe(16);
    expect(f()).toBe(17);
    expect(c()).toBe(99); // c其实更新了两次，以最后一次为准
    expect(b()).toBe(17);
    expect(d()).toBe(15);

    expect(callback_mock_1.mock.calls.length).toBe(11);

    // 异步更新数据(注意不是异步调用model更新)
    d(Promise.resolve(18)).then(() => {
      // 和上面调用链一样
      expect(d()).toBe(18);
      expect(e()).toBe(19);
      expect(f()).toBe(20);
      expect(c()).toBe(99); // c其实更新了两次，以最后一次为准
      expect(b()).toBe(20);
      expect(d()).toBe(18);
      expect(callback_mock_1.mock.calls.length).toBe(15);
    });
    // 和上面调用链一样
    expect(d()).toBe(15);
    expect(e()).toBe(16);
    expect(f()).toBe(17);
    expect(c()).toBe(99);
    expect(b()).toBe(17);
  });

  test('onChange', () => {
    const callback_mock_1 = jest.fn(() => {});
    const a = gluer(1);
    a.onChange((s) => {
      callback_mock_1();
      a(s+1);
    });
    expect(a()).toBe(1);

    a(2);
    expect(a()).toBe(2);
    expect(callback_mock_1.mock.calls.length).toBe(1);

    const callback_mock_2 = jest.fn(() => {});
    const b = gluer(2);
    const c = gluer(3);
    const d = gluer(4);
    const e = gluer(5);
    const f = gluer(6);

    b.onChange(() => {
      callback_mock_2();
      c((_d, s) => {
        return s + 1;
      });
    });

    c.onChange(() => {
      callback_mock_2();
      d((_d, s) => {
        return s + 1;
      });
    });

    d.onChange(() => {
      callback_mock_2();
      e((_d, s) => {
        return s + 1;
      });
      f((_d, s) => {
        return s + 1;
      })
    });

    e.onChange(() => {
      callback_mock_2();
      c((_d, s) => {
        return s + 1;
      });
    });

    f.onChange(() => {
      callback_mock_2();
      d((_d, s) => {
        return s + 1;
      });
    });

    b(3);
    // 有两个调用链
    // 1，b -> c -> d -> e -> c
    // 2，b -> c -> d -> f -> d
    expect(b()).toBe(3);
    expect(c()).toBe(4);
    expect(d()).toBe(5);
    expect(e()).toBe(6);
    expect(c()).toBe(4); // 第一个终点：并不会去更新，也就不会触发onChange
    expect(f()).toBe(7);
    expect(d()).toBe(5); // 第二个终点：并不会去更新，也就不会触发onChange

    expect(callback_mock_2.mock.calls.length).toBe(5);

    // 异步更新数据（注意不是异步调用model更新）
    b(Promise.resolve(4)).then(() => {
      // 和上面调用链一样
      expect(b()).toBe(4);
      expect(c()).toBe(5);
      expect(d()).toBe(6);
      expect(e()).toBe(7);
      expect(c()).toBe(5); // 第一个终点：并不会去更新，也就不会触发onChange
      expect(f()).toBe(8);
      expect(d()).toBe(6); // 第二个终点：并不会去更新，也就不会触发onChange
      expect(callback_mock_2.mock.calls.length).toBe(10);
    });
    expect(b()).toBe(3);
    expect(c()).toBe(4);
    expect(d()).toBe(5);
    expect(e()).toBe(6);
    expect(f()).toBe(7);
  });

  test('watch-onChange-subscribe mixin', () => {
    const callback_mock_1 = jest.fn(() => {});
    const callback_mock_2 = jest.fn(() => {});
    const callback_mock_3 = jest.fn(() => {});
    const a = gluer(1);
    a.watch([a], ([aData]) => {
      callback_mock_1();
      return aData + 1;
    });
    a.onChange((state) => {
      callback_mock_2();
      a(state + 1 );
    } );
    subscribe([a], (aData: number) => {
      callback_mock_3();
      a(aData + 1);
    }, false);

    expect(a()).toBe(1);
    expect(callback_mock_1.mock.calls.length).toBe(0);
    expect(callback_mock_2.mock.calls.length).toBe(0);
    expect(callback_mock_3.mock.calls.length).toBe(0);

    a(2);
    expect(a()).toBe(2);
    expect(callback_mock_1.mock.calls.length).toBe(0);
    expect(callback_mock_2.mock.calls.length).toBe(1);
    expect(callback_mock_3.mock.calls.length).toBe(1);

    a(Promise.resolve(3)).then(() => {
      expect(a()).toBe(3);
      expect(callback_mock_1.mock.calls.length).toBe(0);
      expect(callback_mock_2.mock.calls.length).toBe(2);
      expect(callback_mock_3.mock.calls.length).toBe(2);
    });
    expect(a()).toBe(2);
    expect(callback_mock_1.mock.calls.length).toBe(0);
    expect(callback_mock_2.mock.calls.length).toBe(1);
    expect(callback_mock_3.mock.calls.length).toBe(1);


    const callback_mock_4 = jest.fn(() => {});
    const callback_mock_5 = jest.fn(() => {});
    const b = gluer(2);
    const c = gluer(3);
    const d = gluer(4);
    const e = gluer(5);
    const f = gluer(6);

    b.onChange((bData) => {
      callback_mock_4();
      c(bData + 1);
    });

    c.watch([b], ([bData]) => {
      callback_mock_5();
      return bData + 2;
    });

    subscribe([c], (cData: number) => {
      callback_mock_4();
      d(cData + 1);
    }, false);

    e.watch([d], ([dData]) => {
      callback_mock_4();
      return dData + 1;
    });

    f.watch([d], ([dData]) => {
      callback_mock_4();
      return dData + 1;
    });

    subscribe([e], (eData: number) => {
      callback_mock_4();
      b(eData + 1);
    }, false);

    c.watch([f], ([fData]) => {
      callback_mock_4();
      return fData + 1;
    });

    expect(callback_mock_4.mock.calls.length).toBe(0);

    b(3);

    // 有4个调用链， b 到 c 有两种路径： b的onChange里面调用c和c的watch里面调用c
    // 1，b ->-> c -> d -> e -> b
    // 2，b ->-> c -> d -> f -> c
    expect(b()).toBe(3);
    // expect(c()).toBe(4); c先会是4，在b的onChange中先触发更新，后面几个也会对应变更
    // expect(d()).toBe(5);
    // expect(e()).toBe(6);
    // expect(f()).toBe(6);

    expect(c()).toBe(5); // c后面会更新成5，在c自己的watch中触发更新的
    expect(d()).toBe(6);
    expect(e()).toBe(7);
    expect(f()).toBe(7);

    expect(b()).toBe(3);
    expect(c()).toBe(5);

    expect(callback_mock_4.mock.calls.length).toBe(9);
    expect(callback_mock_5.mock.calls.length).toBe(1);

  })
})
