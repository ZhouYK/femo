import gluer from '../../src/gluer';
import {subscribe} from "../../src";
import {promiseDeprecatedError} from "../../src/genRaceQueue";

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
  const age = gluer((data: number, _state: number) => {
    return data ** 2;
  });
  const tall = gluer((data, state) => {
    return data + state;
  }, 162);

  test('normal test', () => {
    expect(name()).toBe('小光');
    name('小刚');
    expect(name()).toBe('小刚');
    name((_data, state) => {
      if (state === '小刚') {
        return '小刚很棒';
      }
      return state;
    });
    expect(name()).toBe('小刚很棒');
    name('小李', (data, state) => {
      if (data === '小李') {
        return `${data}也很棒`;
      }
      return state;
    });
    expect(name()).toBe('小李也很棒');


    expect(age()).toBe(undefined);
    age(2);
    expect(age()).toBe(4);

    age(3, (data, state) => {
      return data + state;
    });

    expect(age()).toBe(7);

    age((_data: any, state: number) => {
      if (state === 7) {
        return 7 - 2;
      }
      return state;
    });

    expect(age()).toBe(5);

    expect(tall()).toBe(162);

    tall(2);
    expect(tall()).toBe(164);

    tall((_data, state) => {
      if (state === 164) {
        return state * 6;
      }
      return state;
    })

    expect(tall()).toBe(984);

    tall(10, (data, state) => {
      let temp = data;
      if (data >= 10) {
        temp = data - 2;
      }
      return temp * 2 + state;
    });

    expect(tall()).toBe(16 + 984);

  })

  test('promise test', async () => {
    name('小光');
    const namePromise = name(() => {
      return Promise.resolve('坏小孩小光');
    });
    expect(name()).toBe('小光');
    expect.assertions(2);
    await namePromise;
    expect(name()).toBe('坏小孩小光');

    age(2);
    const agePromise = age(async () => {
      return 100;
    });
    expect(age()).toBe(4);
    expect.assertions(2);
    await agePromise;
    expect(age()).toBe(100);

    tall(4, (data) => {
      return data;
    });
    const tallPromise = tall(async () => {
      return 1;
    });
    expect(tall()).toBe(4);

    expect.assertions(6);
    await tallPromise;
    expect(tall()).toBe(1);
  })
})


describe('relyOn test', () => {
  test('normal test', () => {
    const name = gluer('小军');
    const person = gluer({
      name: name(),
      age: 22
    });
    const unsub = person.relyOn([name], (result, state) => {
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

    const unsub = person.relyOn([name], (data, state) => {
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

describe('relyOff test', () => {
  test('normal test', () => {
    const name = gluer('小明');
    const age = gluer(10);
    const student = gluer({
      name: name(),
      age: age(),
    });
    student.relyOn([age], (result, stu) => {
      return {
        ...stu,
        age: result[0],
      }
    });

    student.relyOn([name], (result, stu) => {
      return {
        ...stu,
        name: result[0],
      }
    })
    name('小张');
    expect(name()).toBe('小张');
    expect(student()).toEqual({
      age: 10,
      name: '小张',
    });

    student.off();
    name('小红');
    expect(name()).toBe('小红');
    expect(student()).toEqual({
      age: 10,
      name: '小张',
    });
  });

  test('async test', async () => {

    const callback = jest.fn((n) => n);
    const name = gluer('张清');

    const person = gluer({
      name: name(),
      age: 20,
    });

    person.relyOn([name], callback);

    expect(callback.mock.calls.length).toBe(0);
    await name(Promise.resolve('吴欢'));
    expect(name()).toBe('吴欢');
    expect(callback.mock.calls.length).toBe(1);

    person.off();

    await name(Promise.resolve('小刘'));
    expect(name()).toBe('小刘');
    expect(callback.mock.calls.length).toBe(1);

  })
})

describe('test rest', () => {
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

describe('test history', () => {
  test('track go flush', async () => {
    const page = gluer('页面1');
    const callback = jest.fn((n) => {
      return n;
    });
    const unsubscribe = subscribe([page], callback, false);
    page.go(1);
    page.go(100);
    page.go(0);
    page.go(-1);
    page.go(-100);
    expect(callback.mock.calls.length).toBe(0);

    page('页面2');
    expect(callback.mock.calls.length).toBe(1);
    page.go(1);
    page.go(100);
    page.go(0);
    page.go(-1);
    page.go(-100);
    expect(callback.mock.calls.length).toBe(1);

    // 开始记录 此刻的状态为'页面2'，所以第一条记录的状态为'页面2'
    page.track();
    page('页面3');
    expect(callback.mock.calls.length).toBe(2);

    page.go(-1); // 回退到 '页面2';
    expect(callback.mock.calls.length).toBe(3);
    expect(callback.mock.calls[2][0]).toBe('页面2');
    page.go(1); // 前进道 '页面3';
    expect(callback.mock.calls.length).toBe(4);
    expect(callback.mock.calls[3][0]).toBe('页面3');
    page.go(0); // 保持在当前
    expect(callback.mock.calls.length).toBe(4);
    page('页面4');
    expect(callback.mock.calls.length).toBe(5);
    expect(callback.mock.calls[4][0]).toBe('页面4');
    page.go(100); // 最多前进到 '页面4'
    expect(callback.mock.calls.length).toBe(5);
    page.go(-100); // 最多后退到 '页面2'（开始记录那一页）
    expect(callback.mock.calls.length).toBe(6);
    expect(callback.mock.calls[5][0]).toBe('页面2');
    // 此时正常更新一个'页面5'
    // 之前'页面2'后面的历史记录都会被清除，取而代之的是'页面5'
    page('页面5');
    expect(callback.mock.calls.length).toBe(7);
    expect(callback.mock.calls[6][0]).toBe('页面5');

    page.go(-1);
    expect(callback.mock.calls.length).toBe(8);
    expect(callback.mock.calls[7][0]).toBe('页面2');
    // 继续退，还是页面2，已经到记录的第一条了
    page.go(-1);
    expect(callback.mock.calls.length).toBe(8);

    page.go(1);
    expect(callback.mock.calls.length).toBe(9);
    expect(callback.mock.calls[8][0]).toBe('页面5');
    // 继续前进，还是页面5，已经到记录最后一条了
    page.go(1);
    expect(callback.mock.calls.length).toBe(9);

    await page(async () => {
      return '页面6';
    });

    expect(callback.mock.calls.length).toBe(10);
    expect(callback.mock.calls[9][0]).toBe('页面6');

    // 当前已经是记录中最新的一个了 =》页面6
    page.go(1);
    expect(callback.mock.calls.length).toBe(10);

    page(async () => {
      return '页面7'
    });
    // 由于'页面7'是异步更新的，前进时并未进入记录，所以还是'页面6'
    page.go(1);
    expect(callback.mock.calls.length).toBe(10);

    page.go(-2); // 回退到'页面2'
    expect(callback.mock.calls.length).toBe(11);
    expect(callback.mock.calls[10][0]).toBe('页面2');

    // 停止并清除记录
    page.flush();
    unsubscribe();
  })
});

describe('test cache', () => {
  test('normal', async () => {
    const name = gluer('张三');
    await name.cache(() => Promise.resolve('李四'));
    expect(name()).toBe('李四');
    await name.cache(() => Promise.resolve('王二'));
    expect(name()).toBe('李四');

    name.cacheClean();

    await name.cache(() => Promise.resolve('麻子'));
    expect(name()).toBe('麻子');

    name.cacheClean();
    const p1 = name.cache(() => Promise.resolve('李明'));
    await name.cache(() => Promise.resolve('王红'));
    expect(p1).rejects.toBe(promiseDeprecatedError);
    await name.cache(() => Promise.resolve('张清'));
    expect(name()).toBe('王红');
  });

  test('cached data work only using cache() method', async () => {
    const age = gluer(10);

    await age.cache(() => Promise.resolve(6));
    expect(age()).toBe(6);


    await age.cache(() => Promise.resolve(7));
    expect(age()).toBe(6);

    await age.race(() => Promise.resolve(9));
    expect(age()).toBe(9);

    age(8 );
    expect(age()).toBe(8);

    await age(() => Promise.resolve(11));
    expect(age()).toBe(11);

    await age.cache(() => Promise.resolve(12));
    expect(age()).toBe(6);
  });

});

describe('changeOn & changeOff test', () => {
  const name = gluer('初始名字');
  const callback = jest.fn((n) => n);
  const unsub = name.onChange(callback);
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
  age.onChange(callback_1);
  age.onChange(callback_2);

  age(2);

  expect(callback_1.mock.calls.length).toBe(1);
  expect(callback_2.mock.calls.length).toBe(1);

  age.offChange(callback_1);

  age(3);

  expect(callback_1.mock.calls.length).toBe(1);
  expect(callback_2.mock.calls.length).toBe(2);

  age.offChange();

  age(4);
  expect(callback_1.mock.calls.length).toBe(1);
  expect(callback_2.mock.calls.length).toBe(2);

});

