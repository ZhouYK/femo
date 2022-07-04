import useModel from '../../src/hooks/useModel';
import { act, renderHook } from "@testing-library/react-hooks";
import gluer from "../../src/gluer";
import {useState} from "react";
import {ServiceControl} from "../../index";

const model = gluer(0);

describe('useModel test', () => {
  beforeEach(() => {
    model.reset();
  });
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
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const service = (s: number) => {
        if (count < 6) {
          return Promise.resolve(count + 1);
        }
        return s;
      };
      const [age, clonedModel, { loading, successful }] = useModel(model, service, [count]);
      return {
        age,
        clonedModel,
        loading,
        updateCount,
        successful,
      }
    });
    // 第一次渲染的时候就会发起异步请求
    expect(result.current.age).toBe(0);
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    await waitForNextUpdate();
    expect(result.current.age).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(true);

    act(() => {
      // count的更新会引起service更新，在useIndividualModel中会用最新的service执行一次
      result.current.updateCount(5);
    });

    expect(result.current.age).toBe(1);
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    await waitForNextUpdate();
    expect(result.current.age).toBe(6);
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(true);

    act(() => {
      // count的更新会引起service更新，在useIndividualModel中会用最新的service执行一次
      // 但是service中做了条件判断，当count >= 6时直接返回当前的state。
      result.current.updateCount(6);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(6);

    act(() => {
      result.current.updateCount(1);
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(6);

    act(() => {
      result.current.updateCount(7);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(6);

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

  test('useModel onChange',async () => {
    const onChange_mock = jest.fn((nextState: any, prevState: any) => {
      return {nextState, prevState}
    });
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const service = () => {
        if (count < 6) {
          return Promise.resolve(count + 1);
        }
        return count;
      };

      const [age, clonedModel, { loading }] = useModel(model, service, [count], { onChange: onChange_mock });
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
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);

      const service = () => {
        if (count < 6) {
          return Promise.resolve(count + 1);
        }
        return count;
      };

      const [age, clonedModel, { loading, successful }] = useModel(model,  service,[count]);
      return {
        age,
        clonedModel,
        loading,
        successful,
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
      result.current.clonedModel.race(Promise.resolve(4));
      model.race(2);
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(2);
    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(2);

    act(() => {
      result.current.clonedModel.race(Promise.resolve(10));
      result.current.clonedModel.race(0);
    });
    expect(result.current.age).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);

    act(() => {
      unmount();
    });
  });

  test('useModel localService', async () => {
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);

      const serviceFn = (_s: number, data?: number) => {
        if (count < 6) {
          if (typeof data === 'number') {
            return Promise.resolve(data + count)
          }
          return Promise.resolve(count + 1);
        }
        return count;
      };

      const [age, clonedModel, { loading, service, successful }] = useModel(model,  serviceFn,[count]);
      return {
        age,
        clonedModel,
        loading,
        service,
        successful,
        updateCount,
      }
    });

    act(() => {
      result.current.service();
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.age).toBe(0);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(1);

    act(() => {
      result.current.service(5);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.age).toBe(1);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(5);

    act(() => {
      result.current.updateCount(1);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.age).toBe(5);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(2);

    act(() => {
      result.current.service(2);
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.age).toBe(2);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(3);

    act(() => {
      result.current.service(3);
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(3);

    act(() => {
      result.current.updateCount(6);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(6);
    act(() => {
      result.current.service(2);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(6);

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

      const service = () => {
        service_call_mock();
        if (count < 6) {
          return Promise.resolve(count + 1);
        }
        return count;
      };
      const [age, clonedModel, { loading }] = useModel(model1, service, [count]);
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
      const service = () => {
        service_control_call_mock();
        if (count < 6) {
          return Promise.resolve(count + 1);
        }
        return count;
      };

      const [age, clonedModel, { loading, successful, }] = useModel(model2, service, [count], { control: controlModel });
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
      // successful为true，则更新data
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
      // successful为false，则不会更新data
      controlModel({
        loading: false,
        successful: false,
        data: 0,
      });
    });

    expect(service_control_call_mock.mock.calls.length).toBe(0);
    expect(result2.current.loading).toBe(false);
    expect(result2.current.successful).toBe(false);
    expect(result2.current.age).toBe(1000);

    act(() => {
      result1.current.updateCount(2);
      result2.current.updateCount(2);
    });

    expect(service_call_mock.mock.calls.length).toBe(2);
    expect(service_control_call_mock.mock.calls.length).toBe(1);
    expect(result1.current.age).toBe(1);
    expect(result2.current.age).toBe(1000);

    act(() => {
      // 此时已解绑监听，control的变更不起作用
      // successful为false，则不会更新data
      controlModel({
        loading: false,
        successful: false,
      })
    });

    expect(result1.current.age).toBe(1);
    expect(result2.current.age).toBe(1000);
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

  test('useModel onUpdate', async () => {

    const updateCallback_mock = jest.fn((state, prevState) => {
      return Object.is(state, prevState);
    });

    const changeCallback_mock = jest.fn((state, prevState) => {
      return Object.is(state, prevState);
    });

    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);

      const service = (s: number) => {
        if (count < 6) {
          return Promise.resolve(count + 1);
        }
        if (count === 7) return s;
        return count;
      };

      const [age, clonedModel, { loading, successful }] = useModel(model,  service,[count], {
        onUpdate: updateCallback_mock,
        onChange: changeCallback_mock,
      });
      return {
        age,
        clonedModel,
        loading,
        successful,
        updateCount,
      }
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(0);
    expect(updateCallback_mock.mock.calls.length).toBe(0);
    expect(changeCallback_mock.mock.calls.length).toBe(0);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(result.current.age).toBe(1);
    expect(updateCallback_mock.mock.calls.length).toBe(1);
    expect(changeCallback_mock.mock.calls.length).toBe(1);

    expect(updateCallback_mock.mock.calls[0][0]).toBe(1);
    expect(updateCallback_mock.mock.calls[0][1]).toBe(0);

    expect(changeCallback_mock.mock.calls[0][0]).toBe(1);
    expect(changeCallback_mock.mock.calls[0][1]).toBe(0);

    act(() => {
      result.current.updateCount(1);
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(1);
    expect(updateCallback_mock.mock.calls.length).toBe(1);
    expect(changeCallback_mock.mock.calls.length).toBe(1);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(result.current.age).toBe(2);
    expect(updateCallback_mock.mock.calls.length).toBe(2);
    expect(changeCallback_mock.mock.calls.length).toBe(2);
    expect(updateCallback_mock.mock.calls[1][0]).toBe(2);
    expect(updateCallback_mock.mock.calls[1][1]).toBe(1);
    expect(changeCallback_mock.mock.calls[1][0]).toBe(2);
    expect(changeCallback_mock.mock.calls[1][1]).toBe(1);

    act(() => {
      result.current.updateCount(6);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(6);
    expect(updateCallback_mock.mock.calls.length).toBe(3);
    expect(changeCallback_mock.mock.calls.length).toBe(3);
    expect(updateCallback_mock.mock.calls[2][0]).toBe(6);
    expect(updateCallback_mock.mock.calls[2][1]).toBe(2);
    expect(changeCallback_mock.mock.calls[2][0]).toBe(6);
    expect(changeCallback_mock.mock.calls[2][1]).toBe(2);

    act(() => {
      result.current.updateCount(7);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(6);
    expect(updateCallback_mock.mock.calls.length).toBe(4);
    expect(changeCallback_mock.mock.calls.length).toBe(3);
    expect(updateCallback_mock.mock.calls[3][0]).toBe(6);
    expect(updateCallback_mock.mock.calls[3][1]).toBe(6);


    act(() => {
      unmount();
    });

    act(() => {
      model(8);
    });
    expect(model()).toBe(8);
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(6);
    expect(updateCallback_mock.mock.calls.length).toBe(4);
    expect(changeCallback_mock.mock.calls.length).toBe(3);
    expect(updateCallback_mock.mock.calls[3][0]).toBe(6);
    expect(updateCallback_mock.mock.calls[3][1]).toBe(6);

  })
});
