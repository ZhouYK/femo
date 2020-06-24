import gluer from '../../src/gluer';

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
  const age = gluer((data) => {
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
