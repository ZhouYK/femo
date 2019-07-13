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
    console.log(store.referToState(store.model.mobilePhone));
  });
  test('async customHandler test with async', async () => {
      const name = gluer('小明');
      const store = femo({
          name
      });
      const final = await store.model.name('入参', async () => {
          return '哈哈哈';
      });
      expect(final).toEqual('哈哈哈');
      expect(store.referToState(store.model.name)).toBe('哈哈哈');
  });
  test('async customerHandler test with promise', () => {
      const name = gluer('小明');
      const store = femo({
          name
      });
      const final = store.model.name('入参', async () => {
          return '哈哈哈';
      });
      expect(final).toEqual(Promise.resolve('哈哈哈'));
      // 异步更新，此时还未执行
      expect(store.referToState(store.model.name)).toBe('小明');
      (final as Promise<string>).then((data: string) => {
          expect(store.referToState(store.model.name)).toBe('哈哈哈');
          return Promise.resolve(data);
      }).catch((err: any) => Promise.reject(err))
  })
})
