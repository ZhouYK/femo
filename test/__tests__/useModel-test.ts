import useModel from '../../src/hooks/useModel';
import { act, renderHook } from "@testing-library/react-hooks";
import gluer from "../../src/gluer";
import {useCallback, useState} from "react";
import {ServiceControl} from "../../index";

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

  });

  test('useModel cache', async () => {
    model.reset();
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const service = useCallback(() => {
        if (count < 6) {
          return Promise.resolve(count + 1);
        }
        return count;
      }, [count]);
      const [age, clonedModel, { loading }] = useModel(model, [service], { cache: true });
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
      result.current.updateCount(2);
    });
    expect(result.current.age).toBe(1);
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.age).toBe(1);
    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.updateCount(6);
    });
    expect(result.current.age).toBe(6);
    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.updateCount(3);
    });
    expect(result.current.age).toBe(6);
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.age).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(model.cache()).toBe(1);
    expect(result.current.clonedModel.cache()).toBe(1);

    act(() => {
      // model.cacheClean();
      result.current.clonedModel.cacheClean();
    });

    expect(model.cache()).toBe(undefined);
    expect(result.current.clonedModel.cache()).toBe(undefined);

    act(() => {
      result.current.updateCount(5);
    });
    expect(result.current.age).toBe(1);
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.age).toBe(6);
    expect(result.current.loading).toBe(false);
    expect(model.cache()).toBe(6);
    expect(result.current.clonedModel.cache()).toBe(6);

    act(() => {
      // 卸载时，会解绑model和state
      unmount();
    });

    act(() => {
      model(4);
    });
    expect(result.current.age).toBe(6);
    expect(model()).toBe(4);
  });

  test('useModel onChange',async () => {
    model.reset();
    const onChange_mock = jest.fn((nextState: any, prevState: any) => {
      return {nextState, prevState}
    });
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const service = useCallback(() => {
        if (count < 6) {
          return Promise.resolve(count + 1);
        }
        return count;
      }, [count]);

      const [age, clonedModel, { loading }] = useModel(model, [service], { onChange: onChange_mock });
      return {
        age,
        clonedModel,
        loading,
        updateCount,
      }
    });
    expect(onChange_mock.mock.calls.length).toBe(0);
    expect(result.current.age).toBe(0);
    expect(result.current.loading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.age).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(onChange_mock.mock.calls.length).toBe(1);

    act(() => {
      result.current.updateCount(2);
    });
    expect(result.current.age).toBe(1);
    expect(result.current.loading).toBe(true);
    expect(onChange_mock.mock.calls.length).toBe(1);

    await waitForNextUpdate();

    expect(result.current.age).toBe(3);
    expect(result.current.loading).toBe(false);
    expect(onChange_mock.mock.calls.length).toBe(2);

    act(() => {
      result.current.updateCount(6);
    });

    expect(result.current.age).toBe(6);
    expect(result.current.loading).toBe(false);
    expect(onChange_mock.mock.calls.length).toBe(3);

    act(() => {
      result.current.clonedModel(4);
    });

    expect(result.current.age).toBe(4);
    expect(result.current.loading).toBe(false);
    expect(onChange_mock.mock.calls.length).toBe(4);

    act(() => {
      model(5);
    });

    expect(result.current.age).toBe(5);
    expect(result.current.loading).toBe(false);
    expect(onChange_mock.mock.calls.length).toBe(5);

    act(() => {
      model(5);
    });

    expect(result.current.age).toBe(5);
    expect(result.current.loading).toBe(false);
    expect(onChange_mock.mock.calls.length).toBe(5);

    act(() => {
      unmount();
    });

    act(() => {
      model(6);
    });

    expect(model()).toBe(6);
    expect(result.current.age).toBe(5);
    expect(result.current.loading).toBe(false);
    expect(onChange_mock.mock.calls.length).toBe(5);

  });

  test('useModel loading', async () => {
    model.reset();

    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const service = useCallback(() => {
        if (count < 6) {
          return Promise.resolve(count + 1);
        }
        return count;
      }, [count]);

      const [age, clonedModel, { loading }] = useModel(model, [service]);
      return {
        age,
        clonedModel,
        loading,
        updateCount,
      }
    });

    act(() => {
      result.current.updateCount(2);
    });

    act(() => {
      model.race(() => Promise.resolve(3));
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.age).toBe(0);
    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(3);



    act(() => {
      result.current.clonedModel.race(() => Promise.resolve(4));
      model.race(() => Promise.resolve(5));
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.age).toBe(3);

    await waitForNextUpdate();

    expect(result.current.age).toBe(5);
    expect(result.current.loading).toBe(false);

    act(() => {
      unmount();
    });
  });

  test('useModel control', async () => {
    const model1 = gluer(0);
    const service_call_mock = jest.fn(() => {
    });
    const { result: result1, unmount: unmount1, waitForNextUpdate: waitForNextUpdate1 } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const service = useCallback(() => {
        service_call_mock();
        if (count < 6) {
          return Promise.resolve(count + 1);
        }
        return count;
      }, [count]);

      const [age, clonedModel, { loading }] = useModel(model1, [service]);
      return {
        age,
        clonedModel,
        loading,
        updateCount,
      }
    });


    const controlModel = gluer<ServiceControl>({
      loading: false,
      successful: false,
    });
    const service_control_call_mock = jest.fn(() => {
    });
    const model2 = gluer(0);
    const { result: result2, unmount: unmount2 } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const service = useCallback(() => {
        service_control_call_mock();
        if (count < 6) {
          return Promise.resolve(count + 1);
        }
        return count;
      }, [count]);

      const [age, clonedModel, { loading, successful, }] = useModel(model2, [service], { control: controlModel });
      return {
        age,
        clonedModel,
        loading,
        updateCount,
        successful,
      }
    });

    expect(service_call_mock.mock.calls.length).toBe(1);
    expect(service_control_call_mock.mock.calls.length).toBe(0);

    expect(result1.current.loading).toBe(true);
    expect(result2.current.loading).toBe(false);

    await waitForNextUpdate1();
    // await waitForNextUpdate2();
    expect(result1.current.age).toBe(1);
    expect(result2.current.age).toBe(0);
    expect(result1.current.loading).toBe(false);
    expect(result2.current.loading).toBe(false);
    expect(service_control_call_mock.mock.calls.length).toBe(0);

    act(() => {
      controlModel({
        loading: true,
        successful: true,
        data: 1000,
      });
    });

    expect(service_control_call_mock.mock.calls.length).toBe(0);
    expect(result2.current.loading).toBe(true);
    expect(result2.current.successful).toBe(true);
    expect(result2.current.age).toBe(1000);

    act(() => {
      controlModel({
        loading: false,
        successful: false,
        data: 0,
      });
    });

    expect(service_control_call_mock.mock.calls.length).toBe(0);
    expect(result2.current.loading).toBe(false);
    expect(result2.current.successful).toBe(false);
    expect(result2.current.age).toBe(0);

    act(() => {
      result1.current.updateCount(2);
      result2.current.updateCount(2);
    });

    expect(service_call_mock.mock.calls.length).toBe(2);
    expect(service_control_call_mock.mock.calls.length).toBe(1);
    expect(result1.current.age).toBe(1);
    expect(result2.current.age).toBe(0);

    act(() => {
      // 此时已解绑监听，control的变更不起作用
      controlModel({
        loading: false,
        successful: false,
      })
    });

    expect(result1.current.age).toBe(1);
    expect(result2.current.age).toBe(0);
    expect(result1.current.loading).toBe(true);
    expect(result2.current.loading).toBe(true);
    await waitForNextUpdate1();
    expect(result1.current.loading).toBe(false);
    expect(result2.current.loading).toBe(false);
    expect(result1.current.age).toBe(3);
    expect(result2.current.age).toBe(3);

    act(() => {
      // 此时已解绑监听，control的变更不起作用
      controlModel({
        loading: true,
        successful: true,
      })
    });
    expect(result1.current.loading).toBe(false);
    expect(result2.current.loading).toBe(false);

    act(() => {
      unmount1();
      unmount2();
    })
  });
});
