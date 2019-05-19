import gluer from "../../src/gluer";
import femo from "../../src";
import { duplicatedError } from '../constants';

describe('state edge case test', () => {
  // 主要测试不能使用in操作符的属性类型
  test('some property is undefined', () => {
    const model = {
      hobby: gluer('football'),
      name: undefined // null也同理
    };
    expect(femo(model)).toMatchObject(
      expect.objectContaining({
        getState: expect.any(Function),
        model: expect.any(Object),
        referToState: expect.any(Function),
        hasModel: expect.any(Function)
      })
    )
  });
  // 对象循环引用的问题
  test('circular reference in model', () => {
    const model = {
      hobby: 'football',
      name: undefined,
      person: {}
    };
    model.person = model;
    expect(() => femo(model)).toThrow(duplicatedError);
  });
  // 两个或两个以上的地方使用了同一个model的reference
  test('one model is used more than one place', () => {
    const person = {
      age: gluer(1)
    };
    const model = {
      hobby: 'football',
      name: undefined,
      person
    };
    const human = {
      person
    };
    const wholeModel = { model, human };
    expect(() => femo(wholeModel)).toThrow(duplicatedError);
  });
});
