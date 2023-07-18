import { act, renderHook } from '@testing-library/react-hooks';
import { useState } from 'react';
import useDerivedState from '../../src/hooks/useDerivedState';


describe('useDerivedState test', () => {

  test('useDerivedState basic', async () => {

    const { result, unmount } = renderHook(() => {

      const [name, updateName] = useState('');

      const [age_1] = useDerivedState((state: any) => {
        if (name === '小红') {
          return 10;
        }
        return state || 0;
      }, [name]);

      const [age_2] = useDerivedState(0, (state: any) => {
        if (name === '小刚') {
          return 10
        }
        return state;
      }, [name])

      return {
        age_1,
        age_2,
        updateName
      }
    });

    expect(result.current.age_1).toBe(0);
    expect(result.current.age_2).toBe(0);

    act(() => {
      result.current.updateName('小红');
    });

    expect(result.current.age_1).toBe(10);

    act(() => {
      unmount();
    })

  })

})
