import femo, { gluer } from '../../src';

describe('customHandler test', () => {
  test('customHandler should be called', () => {
    const mockFn = jest.fn((data, state) => {
      return { ...state, ...data };
    });
    const number = gluer('17212349851');
    const mobilePhone = gluer(mockFn, {
      name: '小王',
      number
    });

    const store = femo({
      mobilePhone
    });
    expect(mockFn.mock.calls.length).toBe(0);

    store.model.mobilePhone({
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
    const returnResult = store.model.mobilePhone(data, customMockFn);

    expect(returnResult).toBe(store.referToState(store.model.mobilePhone));
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
      number: '18023482345'
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
      const store = femo({
          name,
          age,
          weight,
      });
      const final = await store.model.name('入参', async () => {
          return '哈哈哈';
      });
      expect(final).toEqual('哈哈哈');
      expect(store.referToState(store.model.name)).toBe('哈哈哈');

      const newAge = await store.model.age(5, async (data) => {
        return data + 1;
      });
      expect(newAge).toEqual(6);
      expect(store.referToState(store.model.age)).toBe(6);

      const newWeight = await store.model.weight(5);
      expect(newWeight).toBe(50);
      expect(store.referToState(store.model.weight)).toBe(50);

  });

  test('async customerHandler test with promise', () => {
      const name = gluer('小明');
      const age = gluer((data) => {
        return data + 2;
      }, 10);
      const weight = gluer(async (data) => {
        return data * 10;
      }, 100);
      const store = femo({
          name,
          age,
          weight,
      });
      const final = store.model.name('入参', async () => {
          return '哈哈哈';
      });
      expect(final).toEqual(Promise.resolve('哈哈哈'));
      // 异步更新，此时还未执行
      expect(store.referToState(store.model.name)).toBe('小明');
      final.then((data: string) => {
          expect(store.referToState(store.model.name)).toBe('哈哈哈');
          return Promise.resolve(data);
      }).catch((err: any) => Promise.reject(err))

    const rejectPromise = store.model.name('promise reject', async () => {
      await Promise.reject('promise reject');
      return 'promise reject';
    });

    expect(rejectPromise).toEqual(Promise.reject('promise reject'));

    const newAge = store.model.age(5, async (data) => {
      return data + 1;
    });
    expect(newAge).toEqual(Promise.resolve(6));
    expect(store.referToState(store.model.age)).toBe(10);

    const newWeight = store.model.weight(5);
    expect(newWeight).toEqual(Promise.resolve(100));
    expect(store.referToState(store.model.weight)).toBe(100);
  })
})
