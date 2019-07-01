import femo, { gluer } from '../../src';

describe('customHandler test', () => {
  test('customHandler should be called', () => {
    const mockFn = jest.fn((data, state) => {
      return { ...state, ...data };
    })
    const mobilePhone = gluer(mockFn, {
      name: '小王',
      number: '17212349851'
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
      return { ...data, ...state, flag: 'custom' }
    });

    const data = {
      name: '小天',
      number: '18023482345'
    };
    const returnResult = store.model.mobilePhone(data, customMockFn);

    expect(returnResult).toEqual(data);
    expect(mockFn.mock.calls.length).toBe(1);
    expect(customMockFn.mock.calls.length).toBe(1);

    expect(customMockFn.mock.calls[0][0]).toEqual(data);
    expect(customMockFn.mock.calls[0][1]).toEqual({
      name: '小文',
      number: '10998762345'
    });
    console.log(store.referToState(store.model.mobilePhone));
  })
})
