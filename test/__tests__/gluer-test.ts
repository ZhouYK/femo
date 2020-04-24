import gluer from '../../src/gluer';
import { gluerUniqueFlagKey, gluerUniqueFlagValue } from '../../src/constants';

describe('gluer normal test',  () => {
  test('gluer => function', () => {
    expect(gluer).toBeInstanceOf(Function);
  });

  test('gluer`s return => function', () => {
    const gr = gluer();
    expect(gr).toBeInstanceOf(Function);
  });
  test('gluer`s return => uniqueFlag', () => {
    const gr = gluer();
    // @ts-ignore
    expect(gr[gluerUniqueFlagKey]).toBe(gluerUniqueFlagValue);
  });

  test('gluer`s return => return => structure', () => {
    const gr = gluer();
    const result = gr('any');
    expect(result).toMatchObject(
      expect.objectContaining({
        reducer: expect.any(Function),
        action: expect.any(Function),
        initState: undefined
      })
    )
  });

  test('gluer`s return => return => reducer & action', () => {
    const gr = gluer();
    const result = gr('any');
    // @ts-ignore
    const mockReducer = jest.fn(result.reducer);
    mockReducer(10, 100);
    expect(mockReducer).toBeCalledWith(expect.any(Number), expect.anything());
    expect(mockReducer).toReturnWith(10);

    // @ts-ignore
    const mockAction = jest.fn(result.action);
    mockAction(99);
    expect(mockAction).toBeCalledWith(expect.anything());
    expect(mockAction).toReturnWith(99);
  })
});
describe('gluer exception test', () => {
  test('when pass two arguments, but the first isn`t function', () => {
    // @ts-ignore
    expect(() => gluer('123', 123)).toThrow('first argument must be function');
  });
});
