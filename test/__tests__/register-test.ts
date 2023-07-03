import { act, renderHook } from "@testing-library/react-hooks";
import { useState } from 'react';
import gluer from '../../src/core/gluer';
import useDerivedState from '../../src/hooks/useDerivedState';
import { FemoModel } from '../../index';
import { genRegister } from '../../src/index'

describe('register test', () => {
  test('normal test', () => {

    interface GlobalModel {
      name: FemoModel<string>;
      age: FemoModel<number>;
      family: FemoModel<{ count: number }>
    }
    const { register, unregister, pick, useRegister, usePick } = genRegister<GlobalModel>();

    const name = gluer('小明');
    const age = gluer(0);
    const family = gluer({
      count: 3,
    });

    expect(pick('name')).toBe(undefined);
    expect(pick('age')).toBe(undefined);
    expect(pick('family')).toBe(undefined);

    register('name', name);
    register('age', age);
    register('family', family);
    expect(pick('name')).toBe(name);
    expect(pick('age')).toBe(age);
    expect(pick('family')).toBe(family);

    unregister('name');
    expect(pick('name')).toBe(undefined);
    // key 和 model 都要相同才会被注销
    unregister('age', gluer(2));
    expect(pick('age')).toBe(age);

    unregister('age', age);
    expect(pick('age')).toBe(undefined);
    unregister('family');
    expect(pick('family')).toBe(undefined);

    const {result, unmount } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const [nm] = useDerivedState(() => {
        if (!count) return name;
        return gluer('小张');
      }, [count]);

      useRegister('name', nm);
      useRegister('age', age);
      useRegister('family', family);
      const nameModel = usePick('name');
      const ageModel = usePick('age');
      const familyModel = usePick('family');

      return {
        count,
        updateCount,
        nameModel,
        ageModel,
        familyModel
      }
    })

    expect(result.current.count).toBe(0);
    expect(result.current.nameModel).toBe(name);
    expect(result.current.ageModel).toBe(age);
    expect(result.current.familyModel).toBe(family);

    act(() => {
      result.current.updateCount((prevState) => prevState + 1);
    })


    expect(result.current.count).toBe(1);
    expect(Object.is(result.current.nameModel, name)).toBe(false);
    expect(result.current.ageModel).toBe(age);
    expect(result.current.familyModel).toBe(family);

    act(() => {
      unmount();
    })

    expect(pick('name')).toBe(undefined);
    expect(pick('age')).toBe(undefined);
    expect(pick('family')).toBe(undefined);
  })
})
