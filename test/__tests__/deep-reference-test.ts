import femo, { gluer } from '../../src';

describe('deep reference consistence test', () => {
  test('直接在femo中的对象嵌套gluer节点', () => {
    const floor_1 = gluer(1);
    const floor_object_1 = {
      number: floor_1,
    };
    const store = femo({
      floor_object_1,
    });
    expect(floor_object_1.number).toBeInstanceOf(Function);
    expect(floor_object_1.number).toBe(store.model.floor_object_1.number);
  });

  test('在gluer定义节点的初始值中嵌套节点', () => {
    const floor_1 = gluer(1);

    const floor_2 = gluer({
      child: floor_1,
    });

    const floor_object_2 = {
      number: floor_2,
    };

    const store = femo({
      floor_object_2,
    });

    expect(floor_object_2.number).toBeInstanceOf(Function);
    expect(floor_object_2.number).toBe(store.model.floor_object_2.number);

    expect(floor_object_2.number.child).toBeInstanceOf(Function);
    expect(store.model.floor_object_2.number.child).toBeInstanceOf(Function);
    expect(floor_object_2.number.child).toBe(store.model.floor_object_2.number.child);
    // floor_2是一个gluer声明的节点，其本身上面不会任何附加属性
    // 有附加属性的全是生成的对应的action function
    expect(floor_2.child).toBe(undefined);

  });

  test('在gluer定义节点的初始值中嵌套包含节点的对象', () => {
    const floor_1 = gluer(1);

    const floor_object_1 = {
      number: floor_1,
    };

    const floor_2 = gluer({
      child: floor_object_1,
    });

    const floor_object_2 = {
      number: floor_2,
    };

    const store = femo({
      floor_object_2,
    });

    expect(floor_object_2.number).toBeInstanceOf(Function);
    expect(floor_object_2.number).toBe(store.model.floor_object_2.number);

    expect(floor_object_1.number).toBeInstanceOf(Function);
    expect(floor_object_2.number.child.number).toBeInstanceOf(Function);
    expect(store.model.floor_object_2.number.child.number).toBeInstanceOf(Function);
    expect(floor_object_2.number.child.number).toBe(store.model.floor_object_2.number.child.number);
    expect(floor_object_1.number).toBe(floor_object_2.number.child.number);

    expect(store.referToState(floor_object_1.number)).toBe(1);
    expect(store.referToState(floor_object_2.number.child.number)).toBe(1);
    expect(store.referToState(store.model.floor_object_2.number.child.number)).toBe(1);

    floor_object_1.number(2);
    expect(store.referToState(floor_object_1.number)).toBe(2);
    expect(store.referToState(floor_object_2.number.child.number)).toBe(2);
    expect(store.referToState(store.model.floor_object_2.number.child.number)).toBe(2);

    floor_object_2.number.child.number(3);
    expect(store.referToState(floor_object_1.number)).toBe(3);
    expect(store.referToState(floor_object_2.number.child.number)).toBe(3);
    expect(store.referToState(store.model.floor_object_2.number.child.number)).toBe(3);

    store.model.floor_object_2.number.child.number(4);
    expect(store.referToState(floor_object_1.number)).toBe(4);
    expect(store.referToState(floor_object_2.number.child.number)).toBe(4);
    expect(store.referToState(store.model.floor_object_2.number.child.number)).toBe(4);

    expect(store.getState()).toEqual({
      floor_object_2: {
        number: {
          child: {
            number: 4,
          }
        }
      }
    });

    expect(store.referToState(store.model.floor_object_2)).toBe(store.referToState(floor_object_2));
    expect(store.referToState(floor_object_2)).toEqual({
      number: {
        child: {
          number: 4,
        }
      }
    });

    expect(store.referToState(store.model.floor_object_2.number.child)).toBe(store.referToState(floor_object_2.number.child));
    expect(store.referToState(floor_object_2.number.child)).toBe(store.referToState(floor_object_1));
    expect(store.referToState(floor_object_1)).toEqual({
      number: 4,
    });

    // floor_2是一个gluer声明的节点，其本身上面不会任何附加属性
    // 有附加属性的全是生成的对应的action function
    expect(floor_2.child).toBe(undefined);
  })
});
