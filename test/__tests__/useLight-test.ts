import { act, renderHook } from '@testing-library/react-hooks';
import { useState } from 'react';
import useLight from '../../src/hooks/useLight';


describe('useLight test', () => {

  test('useLight basic', () => {

    const callbackMock = jest.fn(() => {});
    const { result, unmount } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const [, updateAge] = useState(0);
      useLight(callbackMock, [count]);
      return {
        count,
        updateCount,
        updateAge,
      }
    });

    expect(result.current.count).toBe(0);
    expect(callbackMock.mock.calls.length).toBe(0);

    act(() => {
      result.current.updateCount((prevState) => prevState + 1);
    });
    expect(result.current.count).toBe(1);
    expect(callbackMock.mock.calls.length).toBe(1);

    act(() => {
      result.current.updateAge((prevState) => prevState + 1);
    });

    expect(result.current.count).toBe(1);
    expect(callbackMock.mock.calls.length).toBe(1);

    act(() => {
      unmount();
    })

  })

});
