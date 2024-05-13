import { act, renderHook } from '@testing-library/react-hooks';
import { useState } from 'react';
import useSkipMountEffect from '../../src/hooks/useSkipMountEffect';


describe('useSkipMountEffect test', () => {

  test('useSkipMountEffect basic', () => {

    const callbackMock = jest.fn(() => {});
    const { result, unmount } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const [, updateAge] = useState(0);
      useSkipMountEffect(callbackMock, [count]);
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
