import { renderHook, act } from '@testing-library/react-hooks';
import { gluer, useBatchDerivedModel, useModel } from '../../src/index';

describe('useBatchDerivedStateToModel test', () => {
  test('basic', () => {
    const model_1 = gluer(1);
    const model_2 = gluer(2);
    const model_3 = gluer(3);
    let result: any[] = [];
    const callbackFn_1 = jest.fn(() => {

    });
    const callbackFn_2 = jest.fn(() => {

    });
    const callbackFn_3 = jest.fn(() => {

    });
    const { unmount } = renderHook(() => {
      const [m_1] = useModel(model_1);
      const [m_2] = useModel(model_2);
      const [m_3] = useModel(model_3);
      const [, model_4] = useBatchDerivedModel(0, {
        source: m_1,
        callback: (ns, ps, s, previousStatus) => {
          callbackFn_1();
          result.push(previousStatus);
          if (ns !== ps) {
            return ns;
          }
          return s;
        }
      }, {
        source: m_2,
        callback: (ns, ps, s, previousStatus) => {
          callbackFn_2();
          result.push(previousStatus);
          if (ns !== ps) return ns;

          return s;

        }
      }, {
        source: m_3,
        callback: (ns, ps, s, previousStatus) => {
          callbackFn_3();
          result.push(previousStatus);
          if (ns !== ps) {
            return ns;
          }
          return s;
        }
      });

      return {
        model_4,
      }
    });

    expect(callbackFn_1.mock.calls.length).toBe(1);
    expect(callbackFn_2.mock.calls.length).toBe(1);
    expect(callbackFn_3.mock.calls.length).toBe(1);
    expect(result[0]).toBe(undefined);
    expect(result[1]).toEqual({
      source: 1,
      prev: undefined,
      stateChanged: false,
    });
    expect(result[2]).toEqual({
      source: 2,
      prev: {
        source: 1,
        prev: undefined,
        stateChanged: false,
      },
      stateChanged: false,
    })
    act(() => {
      result = [];
      model_1(100);
    });

    expect(result[0]).toBe(undefined);
    expect(result[1]).toEqual({
      source: 100,
      stateChanged: true,
      prev: undefined,
    });
    expect(result[2]).toEqual({
      source: 2,
      prev: {
        source: 100,
        stateChanged: true,
        prev: undefined,
      },
      stateChanged: false,
    })
    expect(callbackFn_1.mock.calls.length).toBe(2);
    expect(callbackFn_2.mock.calls.length).toBe(2);
    expect(callbackFn_3.mock.calls.length).toBe(2);
    act(() => {
      result = [];
      model_3(300);
    });
    expect(result[0]).toBe(undefined);
    expect(result[1]).toEqual({
      source: 100,
      prev: undefined,
      stateChanged: false,
    });
    expect(result[2]).toEqual({
      source: 2,
      stateChanged: false,
      prev: {
        source: 100,
        stateChanged: false,
        prev: undefined,
      }
    })
    expect(callbackFn_1.mock.calls.length).toBe(3);
    expect(callbackFn_2.mock.calls.length).toBe(3);
    expect(callbackFn_3.mock.calls.length).toBe(3);

    act(() => {
      result = [];
      model_2(200)
    });

    expect(result[0]).toBe(undefined);
    expect(result[1]).toEqual({
      source: 100,
      prev: undefined,
      stateChanged: false,
    });
    expect(result[2]).toEqual({
      source: 200,
      prev: {
        source: 100,
        prev: undefined,
        stateChanged: false,
      },
      stateChanged: true,
    })

    act(() => {
      unmount();
    })
  })
})
