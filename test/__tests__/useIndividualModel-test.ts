import useIndividualModel from "../../src/hooks/useIndividualModel";
import {act, renderHook} from "@testing-library/react-hooks";
import { useCallback, useRef, useState } from "react";


describe('useIndividualModel test', () => {

  test('useIndividualModel basic', async () => {
    const { result, unmount, waitForNextUpdate } = renderHook(() => useIndividualModel(0));
    expect(result.current[0]).toBe(0);
    act(() => {
      // 原始model
      result.current[1](1);
    });
    // state
    expect(result.current[0]).toBe(1);
    // status中的loading
    expect(result.current[3].loading).toBe(false);

    act(() => {
      // 克隆的model
      result.current[2](2);
    });
    // state
    expect(result.current[0]).toBe(2);
    expect(result.current[3].loading).toBe(false);

    act(() => {
      // 原始model异步更新
      result.current[1](Promise.resolve(3));
    });

    // 此时异步更新未生效
    expect(result.current[0]).toBe(2);
    // 原始model异步更新不会触发loading变化
    expect(result.current[3].loading).toBe(false);

    await waitForNextUpdate();

    // 异步更新结束，数据为最新
    expect(result.current[0]).toBe(3);

    act(() => {
      // 克隆model异步更新
      result.current[2](Promise.resolve(4));
    });

    // 此时异步更新未生效
    expect(result.current[0]).toBe(3);
    // 克隆model异步更新会触发loading变化
    expect(result.current[3].loading).toBe(true);

    await waitForNextUpdate();

    // 异步更新结束，数据为最新
    expect(result.current[0]).toBe(4);
    expect(result.current[3].loading).toBe(false);

    act(() => {
      // 卸载时会触发解绑数据
      unmount();
    });

    // 解绑过后，更新数据
    act(() => {
      result.current[1](5);
    });

    // 解绑后更新model并不会触发react的state更新
    expect(result.current[0]).toBe(4);
    // model是最新的
    expect(result.current[1]()).toBe(5);
  })

  test('useIndividualModel service deps', async () => {

    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const countRef = useRef(count);
      countRef.current = count;
      const service = useCallback(jest.fn((s: number,_, _index?: number[]) => {
        if (countRef.current < 6) {
          return Promise.resolve(countRef.current + 1);
        }
        return s;
      }), []);
      const [state, model, clonedModel, { loading, successful }] = useIndividualModel(count, service, [count]);
      return {
        state,
        model,
        clonedModel,
        loading,
        updateCount,
        successful,
        service,
      }
    });
    // 第一次渲染的时候就会发起异步请求
    expect(result.current.state).toBe(0);
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.service.mock.calls.length).toBe(1);
    expect(result.current.service.mock.calls[0][2]).toEqual([]);
    await waitForNextUpdate();
    expect(result.current.state).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(true);

    act(() => {
      // count的更新会引起service更新，在useIndividualModel中会用最新的service执行一次
      result.current.updateCount(5);
    });

    expect(result.current.state).toBe(1);
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.service.mock.calls.length).toBe(2);
    expect(result.current.service.mock.calls[1][2]).toEqual([0]);
    await waitForNextUpdate();
    expect(result.current.state).toBe(6);
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(true);

    act(() => {
      // count的更新会引起service更新，在useIndividualModel中会用最新的service执行一次
      // 但是service中做了条件判断，当count >= 6时直接返回当前的state。所以并不会执行异步，但会把 loading、successful 重置为 false
      result.current.updateCount(6);
    });
    expect(result.current.state).toBe(6);
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.service.mock.calls.length).toBe(3);
    expect(result.current.service.mock.calls[2][2]).toEqual([0]);
    act(() => {
      // 执行 异步更新
      result.current.updateCount(1);
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.service.mock.calls.length).toBe(4);
    expect(result.current.service.mock.calls[3][2]).toEqual([0]);
    act(() => {
      // 执行 同步更新
      // 该同步更新会让 上面那个 异步更新 无效
      result.current.updateCount(6);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.state).toBe(6);
    expect(result.current.service.mock.calls.length).toBe(5);
    expect(result.current.service.mock.calls[4][2]).toEqual([0]);
    act(() => {
      // 卸载时，会解绑model和state
      unmount();
    });

    act(() => {
      // 此时更新model
      result.current.model(3);
    });

    expect(result.current.state).toBe(6);
    // model中的值会是最新的
    expect(result.current.model()).toBe(3);

  })

  // todo suspense test
})
