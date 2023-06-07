import gluer from '../../src/core/gluer';
import {subscribe} from "../../src";

describe('gluer normal test',  () => {
  test('gluer => function', () => {
    expect(gluer).toBeInstanceOf(Function);
  });

  test('gluer`s return => function', () => {
    const gr = gluer(0);
    expect(gr).toBeInstanceOf(Function);
  });
});
describe('gluer exception test', () => {
  test('when pass two arguments, but the first isn`t function', () => {
    // @ts-ignore
    expect(() => gluer('123', 123)).toThrow('first argument must be function');
  });
});

describe('gluer update data test', () => {
  const name = gluer('小光');
  const age = gluer((state: number, data: number) => {
    if (typeof data === 'number') {
      return data ** 2;
    }
    return state;
  });
  const tall = gluer((state, data) => {
    if (typeof data === 'number') {
      return data + state;
    }
    return state;
  }, 162);

  test('normal test', () => {
    expect(name()).toBe('小光');
    name('小刚');
    expect(name()).toBe('小刚');
    name((state) => {
      if (state === '小刚') {
        return '小刚很棒';
      }
      return state;
    });
    expect(name()).toBe('小刚很棒');
    name('小李', (state, data) => {
      if (data === '小李') {
        return `${data}也很棒`;
      }
      return state;
    });
    expect(name()).toBe('小李也很棒');


    expect(age()).toBe(undefined);
    age(2);
    expect(age()).toBe(4);

    age(3, (state, data) => {
      return data + state;
    });

    expect(age()).toBe(9);

    age((state: number, _data: any) => {
      if (state === 9) {
        return 9 - 2;
      }
      return state;
    });

    expect(age()).toBe(7);

    expect(tall()).toBe(162);

    tall(2);
    expect(tall()).toBe(4);

    tall((state, _data) => {
      if (state === 4) {
        return state * 6;
      }
      return state;
    })

    expect(tall()).toBe(24);

    tall(10, (state, data) => {
      let temp = data;
      if (data >= 10) {
        temp = data - 2;
      }
      return temp * 2 + state;
    });

    expect(tall()).toBe(10 + 40);

  })

  test('promise test', async () => {
    name('小光');
    const namePromise = name(() => {
      return Promise.resolve('坏小孩小光');
    });
    expect(name()).toBe('小光');
    await namePromise;
    expect(name()).toBe('坏小孩小光');

    age(2);
    const agePromise = age(async () => {
      return 100;
    });
    expect(age()).toBe(4);
    await agePromise;
    expect(age()).toBe(100);

    tall(4, (_state, data) => {
      return data;
    });
    const tallPromise = tall(async () => {
      return 1;
    });
    expect(tall()).toBe(8);

    await tallPromise;
    expect(tall()).toBe(1);
  })
})


describe('watch test', () => {
  test('normal test', () => {
    const name = gluer('小军');
    const person = gluer({
      name: name(),
      age: 22
    });
    const unsub = person.watch([name], (result, state) => {
      return {
        ...state,
        name: result[0],
      }
    });
    name('张明');
    expect(name()).toBe('张明');

    const personCallback_1 = jest.fn((data) => {
      return data;
    });
    subscribe([person], personCallback_1);
    expect(personCallback_1.mock.calls.length).toBe(1);
    expect(personCallback_1.mock.calls[0][0]).toEqual({
      name: '张明',
      age: 22,
    });
    expect(personCallback_1.mock.results[0].value).toEqual({
      name: '张明',
      age: 22,
    });
    expect(person()).toEqual({
      name: '张明',
      age: 22,
    });

    name('李玲');
    expect(name()).toBe('李玲');
    expect(personCallback_1.mock.calls.length).toBe(2);
    expect(personCallback_1.mock.calls[1][0]).toEqual({
      name: '李玲',
      age: 22,
    });
    expect(personCallback_1.mock.results[1].value).toEqual({
      name: '李玲',
      age: 22,
    });
    expect(person()).toEqual({
      name: '李玲',
      age: 22,
    });

    // 取消依赖
    unsub();
    name('张达');
    expect(name()).toBe('张达');
    expect(personCallback_1.mock.calls.length).toBe(2);
    expect(person()).toEqual({
      name: '李玲',
      age: 22,
    });
  });

  test('async test', () => {
    const name = gluer('张清');

    const person = gluer({
      name: name(),
      age: 20,
    });

    const unsub = person.watch([name], (data, state) => {
      return Promise.resolve({
        ...state,
        name: data[0],
      });
    });

    name('吴欢');
    expect(name()).toBe('吴欢');

    subscribe([person], (data) => {
      expect(data).toEqual({
        name: '吴欢',
        age: 20,
      });
    }, false);

    expect(person()).toEqual({
      name: '张清',
      age: 20,
    });

    unsub();
  })
})

describe('unbind watch test', () => {
  test('normal test', () => {

    const mock_fn_1 = jest.fn((result, stu) => {
      return {
        ...stu,
        age: result[0],
      }
    });

    const mock_fn_2 = jest.fn((result, stu) => {
      return {
        ...stu,
        name: result[0],
      }
    });
    const name = gluer('小明');
    const age = gluer(10);
    const student = gluer({
      name: name(),
      age: age(),
    });
    const unsub_1 = student.watch([age], mock_fn_1);

    const unsub_2 = student.watch([name], mock_fn_2);
    name('小张');
    expect(name()).toBe('小张');
    expect(student()).toEqual({
      age: 10,
      name: '小张',
    });
    expect(mock_fn_1.mock.calls.length).toBe(0);
    expect(mock_fn_2.mock.calls.length).toBe(1);

    age(20);
    expect(age()).toBe(20);
    expect(student()).toEqual({
      age: 20,
      name: '小张',
    });
    expect(mock_fn_1.mock.calls.length).toBe(1);
    expect(mock_fn_2.mock.calls.length).toBe(1);

    unsub_1();
    unsub_2();
    name('小红');
    age(30);
    expect(name()).toBe('小红');
    expect(age()).toBe(30);
    expect(student()).toEqual({
      age: 20,
      name: '小张',
    });
    expect(mock_fn_1.mock.calls.length).toBe(1);
    expect(mock_fn_2.mock.calls.length).toBe(1);
  });

  test('async test', async () => {

    const callback = jest.fn((n) => n);
    const name = gluer('张清');

    const person = gluer({
      name: name(),
      age: 20,
    });

    const unsub = person.watch([name], callback);

    expect(callback.mock.calls.length).toBe(0);
    await name(Promise.resolve('吴欢'));
    expect(name()).toBe('吴欢');
    expect(callback.mock.calls.length).toBe(1);

    unsub();

    await name(Promise.resolve('小刘'));
    expect(name()).toBe('小刘');
    expect(callback.mock.calls.length).toBe(1);

  })
})

describe('test rest', () => {
  test('rest', () => {
    const name = gluer('初始名字');
    const callback = jest.fn((n) => {
      return n;
    });
    const unsubscribe = subscribe([name], callback);
    name('小红');
    expect(callback.mock.calls[1][0]).toBe('小红');
    expect(name()).toBe('小红');
    name.reset();
    expect(callback.mock.calls[2][0]).toBe('初始名字');
    expect((name())).toBe('初始名字');
    unsubscribe();
  })
})

describe('onChange & unbind onChange test', () => {
  test('onChange', () => {
    const name = gluer('初始名字');
    const callback = jest.fn((n) => n);
    const unsub = name.onChange(callback);
    expect(callback.mock.calls.length).toBe(0);
    name('张三');
    expect(callback.mock.calls.length).toBe(1);
    name('张四');
    expect(callback.mock.calls.length).toBe(2);
    unsub();
    name('张五');
    expect(callback.mock.calls.length).toBe(2);

    const age = gluer(1);
    const callback_1 = jest.fn((n) => n);
    const callback_2 = jest.fn((n) => n);
    const unsub_1 = age.onChange(callback_1);
    const unsub_2 = age.onChange(callback_2);

    age(2);

    expect(callback_1.mock.calls.length).toBe(1);
    expect(callback_2.mock.calls.length).toBe(1);

    unsub_1();

    age(3);

    expect(callback_1.mock.calls.length).toBe(1);
    expect(callback_2.mock.calls.length).toBe(2);

    unsub_2();

    age(4);
    expect(callback_1.mock.calls.length).toBe(1);
    expect(callback_2.mock.calls.length).toBe(2);
  })
});

describe('model onChange/onUpdate race condition test', () => {
  const model_1 = gluer(0);
  const model_2 = gluer(0);
  const model_3 = gluer(0);

  beforeEach(() => {
    model_1.reset();
    model_2.reset();
    model_3.reset();
  })

  test('model onChange race condition', async () => {
    let p1, p2;

    const callback_1 = jest.fn(() => {});
    const unsub_1 = model_1.onChange(() => {
      callback_1();
    });

    const callback_2 = jest.fn(() => {});
    const unsub_2 = model_2.onChange((s) => {
      callback_2();
      p1 = model_1.race(new Promise((resolve) => {
        setTimeout(() => resolve(s), 1000);
      }));
      p1.catch((e) => {
        console.log('p1', e);
      })
    });


    const callback_3 = jest.fn(() => {});
    const unsub_3 = model_3.onChange((s) => {
      callback_3();
      p2 = model_2.race(new Promise((resolve) => {
        setTimeout(() => resolve(s), 1000);
      }));
      p2.catch((e) => {
        console.log('p2', e);
      });
    });

    expect(callback_1.mock.calls.length).toBe(0);
    expect(callback_2.mock.calls.length).toBe(0);
    expect(callback_3.mock.calls.length).toBe(0);
    await model_3.race(( s, _d,) => {
      return new Promise((resolve) => {
        resolve(s + 1);
      });
    });
    expect(callback_3.mock.calls.length).toBe(1);
    expect(callback_2.mock.calls.length).toBe(0);
    expect(callback_1.mock.calls.length).toBe(0);
    expect(model_3()).toBe(1);
    expect(model_2()).toBe(0);
    expect(model_1()).toBe(0);
    await p2;
    expect(callback_2.mock.calls.length).toBe(1);
    expect(callback_3.mock.calls.length).toBe(1);
    expect(callback_1.mock.calls.length).toBe(0);
    expect(model_2()).toBe(1);
    expect(model_1()).toBe(0);
    await p1;
    expect(model_1()).toBe(1);
    expect(callback_2.mock.calls.length).toBe(1);
    expect(callback_3.mock.calls.length).toBe(1);
    expect(callback_1.mock.calls.length).toBe(1);

    await model_3.race(( s, _d) => {
      return new Promise((resolve) => {
        resolve(s + 1);
      })
    });
    expect(callback_3.mock.calls.length).toBe(2);
    expect(callback_2.mock.calls.length).toBe(1);
    expect(callback_1.mock.calls.length).toBe(1);
    expect(model_3()).toBe(2);
    expect(model_2()).toBe(1);
    expect(model_1()).toBe(1);
    await model_3.race(( s, _d) => {
      return new Promise((resolve) => {
        resolve(s + 1);
      })
    });
    expect(callback_3.mock.calls.length).toBe(3);
    expect(callback_2.mock.calls.length).toBe(1);
    expect(callback_1.mock.calls.length).toBe(1);
    expect(model_3()).toBe(3);
    expect(model_2()).toBe(1);
    expect(model_1()).toBe(1);

    await p2;
    expect(callback_2.mock.calls.length).toBe(2);
    expect(callback_1.mock.calls.length).toBe(1);
    expect(callback_3.mock.calls.length).toBe(3);
    expect(model_2()).toBe(3);
    expect(model_1()).toBe(1);

    await p1;
    expect(callback_1.mock.calls.length).toBe(2);
    expect(callback_2.mock.calls.length).toBe(2);
    expect(callback_3.mock.calls.length).toBe(3);
    expect(model_1()).toBe(3);

    await model_3.race(( s, _d) => {
      return new Promise((resolve) => {
        resolve(s + 1);
      });
    });

    expect(callback_3.mock.calls.length).toBe(4);
    expect(callback_2.mock.calls.length).toBe(2);
    expect(callback_1.mock.calls.length).toBe(2);
    expect(model_3()).toBe(4);
    expect(model_2()).toBe(3);
    expect(model_1()).toBe(3);
    await p2;
    expect(callback_2.mock.calls.length).toBe(3);
    expect(callback_1.mock.calls.length).toBe(2);
    expect(callback_3.mock.calls.length).toBe(4);
    expect(model_2()).toBe(4);
    expect(model_1()).toBe(3);

    await model_3.race(( s, _d) => {
      return new Promise((resolve) => {
        resolve(s + 1);
      })
    });

    expect(callback_3.mock.calls.length).toBe(5);
    expect(callback_2.mock.calls.length).toBe(3);
    expect(callback_1.mock.calls.length).toBe(2);

    expect(model_3()).toBe(5);
    expect(model_2()).toBe(4);
    expect(model_1()).toBe(3);
    await p2;
    expect(callback_2.mock.calls.length).toBe(4);
    expect(callback_1.mock.calls.length).toBe(2);
    expect(callback_3.mock.calls.length).toBe(5);
    expect(model_2()).toBe(5);
    expect(model_1()).toBe(3);

    await p1;
    expect(callback_1.mock.calls.length).toBe(3);
    expect(callback_2.mock.calls.length).toBe(4);
    expect(callback_3.mock.calls.length).toBe(5);
    expect(model_1()).toBe(5);

    unsub_1();
    unsub_2();
    unsub_3();
  });

  test('model onUpdate race condition', async () => {
    // @ts-ignore
    let p1, p2;

    const callback_1 = jest.fn(() => {});
    const unsub_1 = model_1.onUpdate(() => {
      callback_1();
    });

    const callback_2 = jest.fn(() => {});
    const unsub_2 = model_2.onUpdate((s) => {
      callback_2();
      p1 = model_1.race(new Promise((resolve) => {
        setTimeout(() => resolve(s), 1000);
      }));
      p1.catch((e) => {
        console.log('p1', e);
      })
    });

    const callback_3 = jest.fn(() => {});
    const unsub_3 = model_3.onUpdate((s) => {
      callback_3();
      p2 = model_2.race(new Promise((resolve) => {
        setTimeout(() => resolve(s), 1000);
      }));
      p2.catch((e) => {
        console.log('p2', e);
      });
    });

    expect(callback_3.mock.calls.length).toBe(0);
    expect(callback_2.mock.calls.length).toBe(0);
    expect(callback_1.mock.calls.length).toBe(0);

    await model_3.race((s) => {
      return new Promise((resolve) => {
        resolve(s);
      });
    });

    expect(callback_3.mock.calls.length).toBe(1);
    expect(callback_2.mock.calls.length).toBe(0);
    expect(callback_1.mock.calls.length).toBe(0);
    expect(model_3()).toBe(0);
    expect(model_2()).toBe(0);
    expect(model_1()).toBe(0);

    await p2;
    expect(model_3()).toBe(0);
    expect(model_2()).toBe(0);
    expect(model_1()).toBe(0);
    expect(callback_2.mock.calls.length).toBe(1);
    expect(callback_1.mock.calls.length).toBe(0);
    expect(callback_3.mock.calls.length).toBe(1);

    await p1;
    expect(model_3()).toBe(0);
    expect(model_2()).toBe(0);
    expect(model_1()).toBe(0);
    expect(callback_1.mock.calls.length).toBe(1);
    expect(callback_2.mock.calls.length).toBe(1);
    expect(callback_3.mock.calls.length).toBe(1);

    await model_3.race(( s, _) => {
      return new Promise((resolve) => {
        resolve(s + 1);
      })
    });

    expect(model_3()).toBe(1);
    expect(model_2()).toBe(0);
    expect(model_1()).toBe(0);
    expect(callback_3.mock.calls.length).toBe(2);
    expect(callback_2.mock.calls.length).toBe(1);
    expect(callback_1.mock.calls.length).toBe(1);

    await model_3.race(( s, _) => {
      return new Promise((resolve) => {
        resolve(s + 1);
      });
    });
    expect(model_3()).toBe(2);
    expect(model_2()).toBe(0);
    expect(model_1()).toBe(0);

    expect(callback_3.mock.calls.length).toBe(3);
    expect(callback_2.mock.calls.length).toBe(1);
    expect(callback_1.mock.calls.length).toBe(1);

    // 始终拿到的最新的 p2，而不是被 deprecated 的 reject 状态的 promise
    await p2;
    expect(model_2()).toBe(2);
    expect(model_3()).toBe(2);
    expect(model_1()).toBe(0);

    expect(callback_2.mock.calls.length).toBe(2);
    expect(callback_3.mock.calls.length).toBe(3);
    expect(callback_1.mock.calls.length).toBe(1);

    // 始终拿到的最新的 p1，而不是被 deprecated 的 reject 状态的 promise
    await p1;
    expect(model_1()).toBe(2);
    expect(model_2()).toBe(2);
    expect(model_3()).toBe(2);

    expect(callback_1.mock.calls.length).toBe(2);
    expect(callback_2.mock.calls.length).toBe(2);
    expect(callback_3.mock.calls.length).toBe(3);

    await model_3.race(( s, _) => {
      return new Promise((resolve) => {
        resolve(s + 1);
      })
    });

    expect(model_3()).toBe(3);
    expect(model_2()).toBe(2);
    expect(model_1()).toBe(2);
    expect(callback_3.mock.calls.length).toBe(4);
    expect(callback_2.mock.calls.length).toBe(2);
    expect(callback_1.mock.calls.length).toBe(2);

    // 始终拿到的最新的 p2，而不是被 deprecated 的 reject 状态的 promise
    await p2;
    expect(model_2()).toBe(3);
    expect(model_3()).toBe(3);
    expect(model_1()).toBe(2);
    expect(callback_3.mock.calls.length).toBe(4);
    expect(callback_2.mock.calls.length).toBe(3);
    expect(callback_1.mock.calls.length).toBe(2);

    await model_3.race(( s, _) => {
      return new Promise((resolve) => {
        resolve(s + 1);
      })
    });

    expect(model_3()).toBe(4);
    expect(model_2()).toBe(3);
    expect(model_1()).toBe(2);

    expect(callback_3.mock.calls.length).toBe(5);
    expect(callback_2.mock.calls.length).toBe(3);
    expect(callback_1.mock.calls.length).toBe(2);

    // 始终拿到的最新的 p2，而不是被 deprecated 的 reject 状态的 promise
    await p2;
    expect(model_2()).toBe(4);
    expect(model_3()).toBe(4);
    expect(model_1()).toBe(2);
    expect(callback_2.mock.calls.length).toBe(4);
    expect(callback_3.mock.calls.length).toBe(5);
    expect(callback_1.mock.calls.length).toBe(2);

    // 始终拿到的最新的 p1，而不是被 deprecated 的 reject 状态的 promise
    await p1;
    expect(model_1()).toBe(4);
    expect(model_2()).toBe(4);
    expect(model_3()).toBe(4);
    expect(callback_1.mock.calls.length).toBe(3);
    expect(callback_2.mock.calls.length).toBe(4);
    expect(callback_3.mock.calls.length).toBe(5);

    await model_3.race((s) => {
      return new Promise((resolve) => {
        resolve(s + 1);
      })
    });
    expect(model_3()).toBe(5);
    expect(model_2()).toBe(4);
    expect(model_1()).toBe(4);
    expect(callback_3.mock.calls.length).toBe(6);
    expect(callback_2.mock.calls.length).toBe(4);
    expect(callback_1.mock.calls.length).toBe(3);

    // 由 model_3 的 onUpdate 引起的对 model_2 的更新会被竞争掉
    // 如果没被竞争掉，model_2 最终的值会是 5
    model_2.race(4);
    expect(model_2()).toBe(4);
    expect(model_1()).toBe(4);
    expect(model_3()).toBe(5);
    expect(callback_2.mock.calls.length).toBe(5);
    expect(callback_1.mock.calls.length).toBe(3);
    expect(callback_3.mock.calls.length).toBe(6);
    // p2 被竞争掉了，并没有赋值新的 promise，所以这里和上面的 p2 情况不一样，这里还是拿到的不是最新的，而是被竞争掉的 promise
    // 所以它是 reject 状态
    // @ts-ignore
    await p2.catch((e) => console.log('p2', e));
    expect(model_2()).toBe(4);
    expect(model_1()).toBe(4);
    expect(model_3()).toBe(5);
    expect(callback_2.mock.calls.length).toBe(5);
    expect(callback_1.mock.calls.length).toBe(3);
    expect(callback_3.mock.calls.length).toBe(6);

    await p1;
    expect(model_1()).toBe(4);
    expect(model_2()).toBe(4);
    expect(model_3()).toBe(5);
    expect(callback_1.mock.calls.length).toBe(4);
    expect(callback_2.mock.calls.length).toBe(5);
    expect(callback_3.mock.calls.length).toBe(6);


    unsub_3();
    unsub_2();
    unsub_1();

  })


})

