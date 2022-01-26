import useException from '../../src/hooks/useException';
import {act, renderHook} from "@testing-library/react-hooks";
import {useState} from "react";
import {manualThrownError} from "../../src/constants";


describe('useException test', () => {

  test('useException basic', () => {
    const { result, unmount } = renderHook(() => {
      const [flag, updateFlag] = useState(false);
      const manualException = useException(() => flag);
      return {
        ...manualException,
        updateFlag,
      };
    });
    result.current.tryThrow();

    act(() => {
      result.current.updateFlag(true);
    });

    try {
      result.current.tryThrow();
    } catch (err) {
      expect(err).toBe(manualThrownError);
    }

    act(() => {
      result.current.updateFlag(false);
    });

    result.current.tryThrow();

    act(() => {
      unmount();
    });

    try {
      result.current.tryThrow();
    } catch (err) {
      expect(err).toBe(manualThrownError);
    }

  })

})
