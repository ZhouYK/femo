import femo, { gluer } from "../../src";

describe('glue action test', () => {
  const bankAccount = gluer((data, state) => {
    return {
      ...state,
      ...data,
    }
  }, {
    name: '',
    num: 0,
    balance: 0,
  });
  let store = femo({
    bankAccount,
  });

  test('function overload', async () => {
    const account_1 = {
      name: 'account_1',
      num: 1,
      balance: 1000
    }
    store.model.bankAccount(account_1);
    expect(store.referToState(store.model.bankAccount)).toEqual(account_1);

    const account_2 = {
      name: 'account_2',
      num: 2,
      balance: 2000
    };

    store.model.bankAccount(account_2, (data, state) => {
      if (state.balance < 2000) {
        return {
          ...state,
          ...data,
          balance: 0,
        }
      }
      return state;
    });

    expect(store.referToState(store.model.bankAccount)).toEqual({
      ...account_2,
      balance: 0,
    });

    const account_3 = {
      name: 'account_3',
      num: 3,
      balance: 3000
    };

    expect.assertions(1);
    await expect(store.model.bankAccount(account_3, async (data, state) => {
      return {
        ...state,
        ...data,
        balance: 3 * data.balance,
      }
    })).resolves.toEqual({
      ...account_3,
      balance: 9000
    });

    expect(store.referToState(store.model.bankAccount)).toEqual({
      ...account_3,
      balance: 9000
    });


    store.model.bankAccount((_data, state) => {
      return {
        ...state,
        balance: 4000 * 3,
      }
    });

    expect(store.referToState(store.model.bankAccount)).toEqual({
      ...account_3,
      balance: 12000,
    });

    expect.assertions(7);
    await expect(store.model.bankAccount(async (_data, state) => {
      return {
        ...state,
        balance: 20000,
      }
    })).resolves.toEqual({
      ...account_3,
      balance: 20000,
    });

    expect(store.referToState(store.model.bankAccount)).toEqual({
      ...account_3,
      balance: 20000,
    });

  });

});
