import useModel from '../../src/hooks/useModel';
import { act, renderHook } from "@testing-library/react-hooks";
import gluer from "../../src/gluer";
import {useCallback, useState} from "react";

const model = gluer(0);

describe('useModel test', () => {
  test('useModel basic', async () => {
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [age, clonedModel, { loading }] = useModel(model);
      return {
        age,
        clonedModel,
        loading,
      }
    });

    expect(result.current.age).toBe(0);
    expect(result.current.loading).toBe(false);

    act(() => {
      model(1);
    });

    expect(result.current.age).toBe(1);
    expect(result.current.loading).toBe(false);

    act(() => {
      model(Promise.resolve(2));
    });

    expect(result.current.loading).toBe(false);
    await waitForNextUpdate();
    expect(result.current.age).toBe(2);
    expect(result.current.loading).toBe(false);


    act(() => {
      result.current.clonedModel(3);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(3);

    act(() => {
      result.current.clonedModel(Promise.resolve(4));
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.age).toBe(3);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(4);

    act(() => {
      unmount();
    });

    act(() => {
      model(5);
    });
    expect(result.current.age).toBe(4);
  });

  test('useModel service deps', async () => {
    model.reset();
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const service = useCallback((s) => {
        if (count < 6) {
          return Promise.resolve(count + 1);
        }
        return s;
      }, [count]);
      const [age, clonedModel, { loading }] = useModel(model, [service]);
      return {
        age,
        clonedModel,
        loading,
        updateCount,
      }
    });
    // 第一次渲染的时候就会发起异步请求
    expect(result.current.age).toBe(0);
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.age).toBe(1);
    expect(result.current.loading).toBe(false);

    act(() => {
      // count的更新会引起service更新，在useIndividualModel中会用最新的service执行一次
      result.current.updateCount(5);
    });

    expect(result.current.age).toBe(1);
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.age).toBe(6);
    expect(result.current.loading).toBe(false);

    act(() => {
      // count的更新会引起service更新，在useIndividualModel中会用最新的service执行一次
      // 但是service中做了条件判断，当count >= 6时直接返回当前的state。所以并不会执行异步，也不会引起状态更新
      result.current.updateCount(6);
    });
    expect(result.current.age).toBe(6);
    expect(result.current.loading).toBe(false);

    act(() => {
      // 卸载时，会解绑model和state
      unmount();
    });

    act(() => {
      // 此时更新model
      model(3);
    });

    expect(result.current.age).toBe(6);
    // model中的值会是最新的
    expect(model()).toBe(3);

  })
});
