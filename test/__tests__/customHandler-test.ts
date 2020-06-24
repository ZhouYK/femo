import { gluer } from '../../src';

describe('customHandler test', () => {
  test('customHandler should be called', () => {
    const mockFn = jest.fn((data, state) => {
      return { ...state, ...data };
    });
    const mobilePhone = gluer(mockFn, {
      name: '小王',
      number: '17212349851',
    });

    expect(mockFn.mock.calls.length).toBe(0);

    mobilePhone({
      name: '小文',
      number: '10998762345'
    });
    expect(mockFn.mock.calls.length).toBe(1);

    const customMockFn = jest.fn((data, state) => {
      return { ...state, ...data,  flag: 'custom' }
    });

    const data = {
      name: '小天',
      number: '18023482345'
    };
    const returnResult = mobilePhone(data, customMockFn);

    expect(returnResult).toBe(mobilePhone());
    expect(returnResult).toEqual({
      name: '小天',
      number: '18023482345',
      flag: 'custom'
    });
    expect(mockFn.mock.calls.length).toBe(1);
    expect(customMockFn.mock.calls.length).toBe(1);

    expect(customMockFn.mock.calls[0][0]).toEqual(data);
    expect(customMockFn.mock.calls[0][1]).toEqual({
      name: '小文',
      number: '10998762345'
    });
  });
  test('async customHandler test with async', async () => {
    const name = gluer('小明');
    const age = gluer((data) => {
      return data + 2;
    }, 10);
    const weight = gluer(async (data) => {
      return data * 10;
    }, 100);

    const final = await name('入参', async () => {
      return '哈哈哈';
    });
    expect(final).toEqual('哈哈哈');
    expect(name()).toBe('哈哈哈');

    const newAge = await age(5, async (data) => {
      return data + 1;
    });
    expect(newAge).toEqual(6);
    expect(age()).toBe(6);

    const newWeight = await weight(5);
    expect(newWeight).toBe(50);
    expect(weight()).toBe(50);

  });

  test('async customerHandler test with promise', () => {
    const name = gluer('小明');
    const age = gluer((data) => {
      return data + 2;
    }, 10);
    const weight = gluer(async (data) => {
      return data * 10;
    }, 100);

    const final = name('入参', async () => {
      return '哈哈哈';
    });
    expect(final).toEqual(Promise.resolve('哈哈哈'));
    // 异步更新，此时还未执行
    expect(name()).toBe('小明');

    final.then((data: string) => {
      expect(name()).toBe('哈哈哈');
      return Promise.resolve(data);
    }).catch((err: any) => Promise.reject(err))

    const rejectPromise = name('promise reject', async () => {
      await Promise.reject('promise reject');
      return 'promise reject';
    });

    expect(rejectPromise).toEqual(Promise.reject('promise reject'));

    const newAge = age(5, async (data) => {
      return data + 1;
    });
    expect(newAge).toEqual(Promise.resolve(6));
    expect(age()).toBe(10);

    const newWeight = weight(5);
    expect(newWeight).toEqual(Promise.resolve(100));
    expect(weight()).toBe(100);
  })
})
