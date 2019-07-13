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
  })
})
