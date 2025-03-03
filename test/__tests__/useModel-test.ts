import useModel from '../../src/hooks/useModel';
import useIndividualModel from '../../src/hooks/useIndividualModel';
import { act, renderHook } from "@testing-library/react-hooks";
import glue from "../../src/core/glue";
import {useState} from "react";
import { RacePromise, Service, ServiceControl } from "../../index";

const model = glue(0);

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
    // 直接通过 model 变更不会引起 onChange_mock 执行
    expect(onChange_mock.mock.calls.length).toBe(3);

    act(() => {
      model(5);
    });

    expect(result.current.age).toBe(5);
    expect(result.current.loading).toBe(false);
    expect(onChange_mock.mock.calls.length).toBe(3);

    act(() => {
      model(5);
    });

    expect(result.current.age).toBe(5);
    expect(result.current.loading).toBe(false);
    expect(onChange_mock.mock.calls.length).toBe(3);

    act(() => {
      unmount();
    });

    act(() => {
      model(6);
    });

    expect(model()).toBe(6);
    expect(result.current.age).toBe(5);
    expect(result.current.loading).toBe(false);
    expect(onChange_mock.mock.calls.length).toBe(3);
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

      const [age,clonedModel, { loading, successful }] = useModel(model,  service,[count]);
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
    const model1 = glue(0);
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


    const controlModel = glue<ServiceControl>({
      loading: false,
      successful: false,
    });
    const service_control_call_mock = jest.fn(() => {
    });
    const model2 = glue(0);
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

  });

  test('useModel onUpdate race condition test', async () => {

    const onUpdateMock_1 = jest.fn((state, prevState) => {
      return Object.is(state, prevState);
    })

    const { result: result_1, unmount: unmount_1, waitForNextUpdate: waitForNextUpdate_1 } = renderHook(() => {
      const [state, modelWithStatus, { loading, successful }] = useIndividualModel<number>(0, (s) => {
        return s;
      }, [], {
        onUpdate: onUpdateMock_1,
      });

      return {
        state,
        modelWithStatus,
        loading,
        successful,
      }
    });

    const onUpdateMock = jest.fn((state, prevState) => {
      if (state !== prevState) {
        if (state <= 7) {
          result_1.current.modelWithStatus.race(new Promise((resolve) => {
            setTimeout(() => {
              resolve(state);
            }, 1000);
          }))
        } else if (state > 10) {
          result_1.current.modelWithStatus.race(state);
        }
      }
      return Object.is(state, prevState);
    });

    const { result: result_3, unmount: unmount_3, waitForNextUpdate: waitForNextUpdate_3 } = renderHook(() => {
      const [count, updateCount] = useState(0);

      const service = (_s: number) => {
        if (count <= 6) {
          return Promise.resolve(count + 1);
        }
        return count;
      };

      const [age, clonedModel, { loading, successful }] = useModel(model, service, [count], {
        onUpdate: onUpdateMock,
        // onChange: onChangeMock,
      });

      return {
        age,
        clonedModel,
        loading,
        successful,
        updateCount,
      }
    });
    expect(result_1.current.loading).toBe(false);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(0);


    expect(onUpdateMock_1.mock.calls.length).toBe(1);
    expect(onUpdateMock_1.mock.calls[0][0]).toBe(0);
    expect(onUpdateMock_1.mock.calls[0][1]).toBe(0);

    expect(onUpdateMock.mock.calls.length).toBe(0);
    expect(result_3.current.loading).toBe(true);
    expect(result_3.current.successful).toBe(false);
    expect(result_3.current.age).toBe(0);

    await waitForNextUpdate_3();
    expect(result_3.current.loading).toBe(false);
    expect(result_3.current.successful).toBe(true);
    expect(result_3.current.age).toBe(1);

    expect(onUpdateMock.mock.calls.length).toBe(1);
    expect(onUpdateMock.mock.calls[0][0]).toBe(1);
    expect(onUpdateMock.mock.calls[0][1]).toBe(0);

    // onUpdateMock 回调触发 result_1.current.modelWithStatus.race
    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(0);

    await waitForNextUpdate_1({
      timeout: 2000
    });

    // onUpdateMock 回调触发 result_1.current.modelWithStatus.race
    expect(result_1.current.loading).toBe(false);
    expect(result_1.current.successful).toBe(true);
    expect(result_1.current.state).toBe(1);

    // 只有 result_1 的 deps 和 service 进行的更新才会触发 onUpdateMock_1
    // 上面是通过 result_1.current.modelWithStatus.race 触发的，所以回调不会执行
    expect(onUpdateMock_1.mock.calls.length).toBe(1);
    expect(onUpdateMock_1.mock.calls[0][0]).toBe(0);
    expect(onUpdateMock_1.mock.calls[0][1]).toBe(0);

    expect(onUpdateMock.mock.calls.length).toBe(1);
    expect(onUpdateMock.mock.calls[0][0]).toBe(1);
    expect(onUpdateMock.mock.calls[0][1]).toBe(0);


    act(() => {
      result_3.current.updateCount(1);
    });

    expect(result_3.current.age).toBe(1);
    expect(result_3.current.loading).toBe(true);
    expect(result_3.current.successful).toBe(false);
    expect(onUpdateMock.mock.calls.length).toBe(1);
    expect(onUpdateMock.mock.calls[0][0]).toBe(1);
    expect(onUpdateMock.mock.calls[0][1]).toBe(0);

    await waitForNextUpdate_3();

    expect(result_3.current.age).toBe(2);
    expect(result_3.current.loading).toBe(false);
    expect(result_3.current.successful).toBe(true);
    expect(onUpdateMock.mock.calls.length).toBe(2);
    expect(onUpdateMock.mock.calls[1][0]).toBe(2);
    expect(onUpdateMock.mock.calls[1][1]).toBe(1);

    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(1);

    await waitForNextUpdate_1({
      timeout: 2000,
    });

    expect(result_1.current.loading).toBe(false);
    expect(result_1.current.successful).toBe(true);
    expect(result_1.current.state).toBe(2);
    expect(onUpdateMock.mock.calls.length).toBe(2);
    expect(onUpdateMock.mock.calls[1][0]).toBe(2);
    expect(onUpdateMock.mock.calls[1][1]).toBe(1);

    expect(onUpdateMock_1.mock.calls.length).toBe(1);
    expect(onUpdateMock_1.mock.calls[0][0]).toBe(0);
    expect(onUpdateMock_1.mock.calls[0][1]).toBe(0);

    act(() => {
      result_3.current.updateCount(2);
    });
    expect(result_3.current.loading).toBe(true);
    expect(result_3.current.successful).toBe(false);
    expect(result_3.current.age).toBe(2);
    expect(onUpdateMock.mock.calls.length).toBe(2);
    expect(onUpdateMock.mock.calls[1][0]).toBe(2);
    expect(onUpdateMock.mock.calls[1][1]).toBe(1);

    act(() => {
      result_3.current.updateCount(3);
    });
    expect(result_3.current.loading).toBe(true);
    expect(result_3.current.successful).toBe(false);
    expect(result_3.current.age).toBe(2);
    expect(onUpdateMock.mock.calls.length).toBe(2);
    expect(onUpdateMock.mock.calls[1][0]).toBe(2);
    expect(onUpdateMock.mock.calls[1][1]).toBe(1);

    await waitForNextUpdate_3();

    expect(result_3.current.loading).toBe(false);
    expect(result_3.current.successful).toBe(true);
    expect(result_3.current.age).toBe(4);
    expect(onUpdateMock.mock.calls.length).toBe(3);
    expect(onUpdateMock.mock.calls[2][0]).toBe(4);
    expect(onUpdateMock.mock.calls[2][1]).toBe(2);

    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(2);

    await waitForNextUpdate_1({
      timeout: 2000,
    });

    expect(onUpdateMock.mock.calls.length).toBe(3);
    expect(onUpdateMock.mock.calls[2][0]).toBe(4);
    expect(onUpdateMock.mock.calls[2][1]).toBe(2);

    expect(onUpdateMock_1.mock.calls.length).toBe(1);
    expect(onUpdateMock_1.mock.calls[0][0]).toBe(0);
    expect(onUpdateMock_1.mock.calls[0][1]).toBe(0);

    expect(result_1.current.loading).toBe(false);
    expect(result_1.current.successful).toBe(true);
    expect(result_1.current.state).toBe(4);

    act(() => {
      result_3.current.updateCount(4);
    });
    expect(result_3.current.loading).toBe(true);
    expect(result_3.current.successful).toBe(false);
    expect(result_3.current.age).toBe(4);

    await waitForNextUpdate_3();

    expect(result_3.current.loading).toBe(false);
    expect(result_3.current.successful).toBe(true);
    expect(result_3.current.age).toBe(5);
    expect(onUpdateMock.mock.calls.length).toBe(4);
    expect(onUpdateMock.mock.calls[3][0]).toBe(5);
    expect(onUpdateMock.mock.calls[3][1]).toBe(4);

    expect(onUpdateMock_1.mock.calls.length).toBe(1);
    expect(onUpdateMock_1.mock.calls[0][0]).toBe(0);
    expect(onUpdateMock_1.mock.calls[0][1]).toBe(0);


    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(4);

    // 在 onUpdate 中的 race promise 还没返回的时候，又在源数据上发起了一次异步更新
    // 测试在新的一次更新中，onUpdate 触发的 race promise 能否取消掉上一次的 race promise
    act(() => {
      result_3.current.updateCount(5);
    });

    expect(result_3.current.loading).toBe(true);
    expect(result_3.current.successful).toBe(false);
    expect(result_3.current.age).toBe(5);

    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(4);
    expect(onUpdateMock.mock.calls.length).toBe(4);
    expect(onUpdateMock.mock.calls[3][0]).toBe(5);
    expect(onUpdateMock.mock.calls[3][1]).toBe(4);

    expect(onUpdateMock_1.mock.calls.length).toBe(1);
    expect(onUpdateMock_1.mock.calls[0][0]).toBe(0);
    expect(onUpdateMock_1.mock.calls[0][1]).toBe(0);

    await waitForNextUpdate_3();

    expect(result_3.current.loading).toBe(false);
    expect(result_3.current.successful).toBe(true);
    expect(result_3.current.age).toBe(6);
    expect(onUpdateMock.mock.calls.length).toBe(5);
    expect(onUpdateMock.mock.calls[4][0]).toBe(6);
    expect(onUpdateMock.mock.calls[4][1]).toBe(5);

    expect(onUpdateMock_1.mock.calls.length).toBe(1);
    expect(onUpdateMock_1.mock.calls[0][0]).toBe(0);
    expect(onUpdateMock_1.mock.calls[0][1]).toBe(0);

    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(4);

    await waitForNextUpdate_1({
      timeout: 2000,
    });
    await waitForNextUpdate_1({
      timeout: 2000,
    });

    expect(onUpdateMock_1.mock.calls.length).toBe(1);
    expect(onUpdateMock_1.mock.calls[0][0]).toBe(0);
    expect(onUpdateMock_1.mock.calls[0][1]).toBe(0);

    expect(result_1.current.loading).toBe(false);
    expect(result_1.current.successful).toBe(true);
    expect(result_1.current.state).toBe(6);


    act(() => {
      result_3.current.updateCount(6);
    });

    expect(result_3.current.loading).toBe(true);
    expect(result_3.current.successful).toBe(false);
    expect(result_3.current.age).toBe(6);
    expect(onUpdateMock.mock.calls.length).toBe(5);
    expect(onUpdateMock.mock.calls[4][0]).toBe(6);
    expect(onUpdateMock.mock.calls[4][1]).toBe(5);

    expect(onUpdateMock_1.mock.calls.length).toBe(1);
    expect(onUpdateMock_1.mock.calls[0][0]).toBe(0);
    expect(onUpdateMock_1.mock.calls[0][1]).toBe(0);
    await waitForNextUpdate_3();

    expect(result_3.current.loading).toBe(false);
    expect(result_3.current.successful).toBe(true);
    expect(result_3.current.age).toBe(7);

    expect(onUpdateMock.mock.calls.length).toBe(6);
    expect(onUpdateMock.mock.calls[5][0]).toBe(7);
    expect(onUpdateMock.mock.calls[5][1]).toBe(6);

    expect(onUpdateMock_1.mock.calls.length).toBe(1);
    expect(onUpdateMock_1.mock.calls[0][0]).toBe(0);
    expect(onUpdateMock_1.mock.calls[0][1]).toBe(0);

    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(6);

    act(() => {
      // 7 的话 result_3 的 state 不会改变（还是 7），是一个同步数据
      // 并且 onUpdateMock 中也不会执行更新 result_1 的更新
      // 这时预期也应该取消掉上面 result_1 的异步更新
      result_3.current.updateCount(7);
    });

    expect(result_3.current.loading).toBe(false);
    expect(result_3.current.successful).toBe(false);
    expect(result_3.current.age).toBe(7);

    expect(onUpdateMock.mock.calls.length).toBe(7);
    expect(onUpdateMock.mock.calls[6][0]).toBe(7);
    expect(onUpdateMock.mock.calls[6][1]).toBe(7);

    expect(onUpdateMock_1.mock.calls.length).toBe(1);
    expect(onUpdateMock_1.mock.calls[0][0]).toBe(0);
    expect(onUpdateMock_1.mock.calls[0][1]).toBe(0);

    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(6);

    await waitForNextUpdate_1({
      timeout: 2000,
    });


    expect(result_1.current.loading).toBe(false);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(6);

    expect(onUpdateMock_1.mock.calls.length).toBe(1);
    expect(onUpdateMock_1.mock.calls[0][0]).toBe(0);
    expect(onUpdateMock_1.mock.calls[0][1]).toBe(0);

    act(() => {
      unmount_1();
      unmount_3();
    });

  })

  test('useModel onChange race condition test', async () => {

    const onChangeMock_1 = jest.fn((state, prevState) => {
      return Object.is(state, prevState);
    })

    const { result: result_1, unmount: unmount_1, waitForNextUpdate: waitForNextUpdate_1 } = renderHook(() => {
      const [state, modelWithStatus, { loading, successful }] = useIndividualModel<number>(0, (s) => {
        return s;
      }, [], {
        onChange: onChangeMock_1,
      });

      return {
        state,
        modelWithStatus,
        loading,
        successful,
      }
    });

    const onChangeMock_3 = jest.fn((state, prevState) => {
      if (state !== prevState) {
        if (state <= 7) {
          result_1.current.modelWithStatus.race(new Promise((resolve) => {
            setTimeout(() => {
              resolve(state);
            }, 1000);
          }))
        } else if (state > 10) {
          result_1.current.modelWithStatus.race(state);
        }
      }
      return Object.is(state, prevState);
    });

    const { result: result_3, unmount: unmount_3, waitForNextUpdate: waitForNextUpdate_3 } = renderHook(() => {
      const [count, updateCount] = useState(0);

      const service = (_s: number) => {
        if (count <= 6) {
          return Promise.resolve(count + 1);
        }
        return count;
      };

      const [age, clonedModel, { loading, successful }] = useModel(model, service, [count], {
        onChange: onChangeMock_3,
      });

      return {
        age,
        clonedModel,
        loading,
        successful,
        updateCount,
      }
    });
    expect(result_1.current.loading).toBe(false);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(0);


    expect(onChangeMock_1.mock.calls.length).toBe(0);
    expect(onChangeMock_3.mock.calls.length).toBe(0);

    expect(result_3.current.loading).toBe(true);
    expect(result_3.current.successful).toBe(false);
    expect(result_3.current.age).toBe(0);

    await waitForNextUpdate_3();
    expect(result_3.current.loading).toBe(false);
    expect(result_3.current.successful).toBe(true);
    expect(result_3.current.age).toBe(1);

    expect(onChangeMock_3.mock.calls.length).toBe(1);

    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(0);

    await waitForNextUpdate_1({
      timeout: 2000
    });

    expect(result_1.current.loading).toBe(false);
    expect(result_1.current.successful).toBe(true);
    expect(result_1.current.state).toBe(1);

    expect(onChangeMock_1.mock.calls.length).toBe(0);

    expect(onChangeMock_3.mock.calls.length).toBe(1);
    expect(onChangeMock_3.mock.calls[0][0]).toBe(1);
    expect(onChangeMock_3.mock.calls[0][1]).toBe(0);

    act(() => {
      result_3.current.updateCount(1);
    });

    expect(result_3.current.age).toBe(1);
    expect(result_3.current.loading).toBe(true);
    expect(result_3.current.successful).toBe(false);
    expect(onChangeMock_3.mock.calls.length).toBe(1);
    expect(onChangeMock_3.mock.calls[0][0]).toBe(1);
    expect(onChangeMock_3.mock.calls[0][1]).toBe(0);

    await waitForNextUpdate_3();

    expect(result_3.current.age).toBe(2);
    expect(result_3.current.loading).toBe(false);
    expect(result_3.current.successful).toBe(true);
    expect(onChangeMock_3.mock.calls.length).toBe(2);
    expect(onChangeMock_3.mock.calls[1][0]).toBe(2);
    expect(onChangeMock_3.mock.calls[1][1]).toBe(1);

    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(1);

    await waitForNextUpdate_1({
      timeout: 2000,
    });


    expect(onChangeMock_3.mock.calls.length).toBe(2);
    expect(onChangeMock_3.mock.calls[1][0]).toBe(2);
    expect(onChangeMock_3.mock.calls[1][1]).toBe(1);

    expect(result_1.current.loading).toBe(false);
    expect(result_1.current.successful).toBe(true);
    expect(result_1.current.state).toBe(2);

    expect(onChangeMock_1.mock.calls.length).toBe(0);

    act(() => {
      result_3.current.updateCount(2);
    });
    expect(result_3.current.loading).toBe(true);
    expect(result_3.current.successful).toBe(false);
    expect(result_3.current.age).toBe(2);
    expect(onChangeMock_3.mock.calls.length).toBe(2);
    expect(onChangeMock_3.mock.calls[1][0]).toBe(2);
    expect(onChangeMock_3.mock.calls[1][1]).toBe(1);

    act(() => {
      result_3.current.updateCount(3);
    });
    expect(result_3.current.loading).toBe(true);
    expect(result_3.current.successful).toBe(false);
    expect(result_3.current.age).toBe(2);
    expect(onChangeMock_3.mock.calls.length).toBe(2);
    expect(onChangeMock_3.mock.calls[1][0]).toBe(2);
    expect(onChangeMock_3.mock.calls[1][1]).toBe(1);

    await waitForNextUpdate_3();

    expect(result_3.current.loading).toBe(false);
    expect(result_3.current.successful).toBe(true);
    expect(result_3.current.age).toBe(4);
    expect(onChangeMock_3.mock.calls.length).toBe(3);
    expect(onChangeMock_3.mock.calls[2][0]).toBe(4);
    expect(onChangeMock_3.mock.calls[2][1]).toBe(2);

    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(2);

    await waitForNextUpdate_1({
      timeout: 2000,
    });

    expect(onChangeMock_3.mock.calls.length).toBe(3);
    expect(onChangeMock_3.mock.calls[2][0]).toBe(4);
    expect(onChangeMock_3.mock.calls[2][1]).toBe(2);

    expect(onChangeMock_1.mock.calls.length).toBe(0);

    expect(result_1.current.loading).toBe(false);
    expect(result_1.current.successful).toBe(true);
    expect(result_1.current.state).toBe(4);

    act(() => {
      result_3.current.updateCount(4);
    });
    expect(result_3.current.loading).toBe(true);
    expect(result_3.current.successful).toBe(false);
    expect(result_3.current.age).toBe(4);

    await waitForNextUpdate_3();

    expect(result_3.current.loading).toBe(false);
    expect(result_3.current.successful).toBe(true);
    expect(result_3.current.age).toBe(5);
    expect(onChangeMock_3.mock.calls.length).toBe(4);
    expect(onChangeMock_3.mock.calls[3][0]).toBe(5);
    expect(onChangeMock_3.mock.calls[3][1]).toBe(4);

    expect(onChangeMock_1.mock.calls.length).toBe(0);


    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(4);

    // 在 onUpdate 中的 race promise 还没返回的时候，又在源数据上发起了一次异步更新
    // 测试在新的一次更新中，onUpdate 触发的 race promise 能否取消掉上一次的 race promise
    act(() => {
      result_3.current.updateCount(5);
    });

    expect(result_3.current.loading).toBe(true);
    expect(result_3.current.successful).toBe(false);
    expect(result_3.current.age).toBe(5);

    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(4);
    expect(onChangeMock_3.mock.calls.length).toBe(4);
    expect(onChangeMock_3.mock.calls[3][0]).toBe(5);
    expect(onChangeMock_3.mock.calls[3][1]).toBe(4);

    expect(onChangeMock_1.mock.calls.length).toBe(0);

    await waitForNextUpdate_3();

    expect(result_3.current.loading).toBe(false);
    expect(result_3.current.successful).toBe(true);
    expect(result_3.current.age).toBe(6);
    expect(onChangeMock_3.mock.calls.length).toBe(5);
    expect(onChangeMock_3.mock.calls[4][0]).toBe(6);
    expect(onChangeMock_3.mock.calls[4][1]).toBe(5);

    expect(onChangeMock_1.mock.calls.length).toBe(0);

    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(4);

    await waitForNextUpdate_1({
      timeout: 2000,
    });
    await waitForNextUpdate_1({
      timeout: 2000,
    });

    expect(onChangeMock_1.mock.calls.length).toBe(0);

    expect(result_1.current.loading).toBe(false);
    expect(result_1.current.successful).toBe(true);
    expect(result_1.current.state).toBe(6);

    act(() => {
      result_3.current.updateCount(6);
    });

    expect(result_3.current.loading).toBe(true);
    expect(result_3.current.successful).toBe(false);
    expect(result_3.current.age).toBe(6);
    expect(onChangeMock_3.mock.calls.length).toBe(5);
    expect(onChangeMock_3.mock.calls[4][0]).toBe(6);
    expect(onChangeMock_3.mock.calls[4][1]).toBe(5);

    expect(onChangeMock_1.mock.calls.length).toBe(0);
    await waitForNextUpdate_3();

    expect(result_3.current.loading).toBe(false);
    expect(result_3.current.successful).toBe(true);
    expect(result_3.current.age).toBe(7);

    expect(onChangeMock_3.mock.calls.length).toBe(6);
    expect(onChangeMock_3.mock.calls[5][0]).toBe(7);
    expect(onChangeMock_3.mock.calls[5][1]).toBe(6);

    expect(onChangeMock_1.mock.calls.length).toBe(0);

    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(6);

    act(() => {
      // 7 的话 result_3 的 state 不会改变（还是 7），是一个同步数据
      // 并且 onUpdateMock 中也不会执行更新 result_1 的更新
      // 这时预期也应该取消掉上面 result_1 的异步更新
      result_3.current.updateCount(7);
    });

    expect(result_3.current.loading).toBe(false);
    expect(result_3.current.successful).toBe(false);
    expect(result_3.current.age).toBe(7);

    expect(onChangeMock_3.mock.calls.length).toBe(6);
    expect(onChangeMock_3.mock.calls[5][0]).toBe(7);
    expect(onChangeMock_3.mock.calls[5][1]).toBe(6);

    expect(onChangeMock_1.mock.calls.length).toBe(0);

    expect(result_1.current.loading).toBe(true);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(6);

    await waitForNextUpdate_1({
      timeout: 2000,
    });


    expect(result_1.current.loading).toBe(false);
    expect(result_1.current.successful).toBe(false);
    expect(result_1.current.state).toBe(6);

    expect(onChangeMock_1.mock.calls.length).toBe(0);


    act(() => {
      unmount_1();
      unmount_3();
    })
  });

  test('useModel race canceled by self', async () => {

    const model_2 = glue(0);
    let p1: RacePromise | undefined;
    const onUpdate_1 = jest.fn(() => {
      p1 = model_2.race((s) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(s + 1)
          }, 1000);
        })
      })
    })

    const model_1 = glue(0);
    const unmount_1 = model_1.onUpdate(onUpdate_1);


    let p0: RacePromise | undefined;
    const onUpdate_0 = jest.fn(() => {
      p0 = model_1.race((s) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(s + 1);
          }, 1000);
        })
      });
    });
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const [age, clonedModel, { loading, successful }] = useModel(model, () => {
        return Promise.resolve(count + 1);
      }, [count], {
        onUpdate: onUpdate_0,
      });

      return {
        age,
        clonedModel,
        updateCount,
        loading,
        successful,
      }
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(0);
    expect(model_1()).toBe(0);
    expect(onUpdate_0.mock.calls.length).toBe(0);
    expect(onUpdate_1.mock.calls.length).toBe(0);

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(result.current.age).toBe(1);
    expect(model_1()).toBe(0);
    expect(onUpdate_0.mock.calls.length).toBe(1);

    // 看是否能取消掉 onUpdate_1 中生成的 race promise
    // 预期是无法取消的
    model.race((s) => {
      return s;
    });
    // 直接调用 model.race 无法触发通过 useModel 注册的 onUpdate
    expect(onUpdate_0.mock.calls.length).toBe(1)

    if (p0) {
      console.log('p0: 进来啦');
      await p0;
      p0 = undefined;
      expect(model_1()).toBe(1);
      expect(onUpdate_1.mock.calls.length).toBe(1);
      expect(model_2()).toBe(0);
      if (p1) {
        console.log('p1: 进来啦');
        await p1;
        p1 = undefined;
        expect(model_2()).toBe(1);
      }
    }

    act(() => {
      result.current.updateCount(1);
    });
    expect(result.current.age).toBe(1);
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);

    await waitForNextUpdate();

    expect(result.current.age).toBe(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(onUpdate_0.mock.calls.length).toBe(2);

    if (p0) {
      console.log('p0: 进来啦 X2');
      await p0;
      p0 = undefined;
      expect(model_1()).toBe(2);
      expect(onUpdate_1.mock.calls.length).toBe(2);
      // 此刻 model_2.race 已经调用，这时调用 model.race 看是否能取消 model_2.race 产生的 race promise
      // 预期是无法取消的
      await model.race((s) => {
        return Promise.resolve(s);
      });
      // 直接调用 model.race 无法触发通过 useModel 注册的 onUpdate
      expect(onUpdate_0.mock.calls.length).toBe(2);

      if (p1) {
        console.log('p1: 进来啦 X2');
        await p1;
        p1 = undefined;
        expect(model_2()).toBe(2);
      }
    }

    act(() => {
      result.current.updateCount(2);
    });

    expect(result.current.age).toBe(2);
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);

    await waitForNextUpdate();

    expect(result.current.age).toBe(3);
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(onUpdate_0.mock.calls.length).toBe(3);

    if (p0) {
      console.log('p0: 进来啦 X3');
      await p0;
      p0 = undefined;
      expect(model_1()).toBe(3);
      expect(onUpdate_1.mock.calls.length).toBe(3);
    }

    // 此时在 onUpdate_1 中 model_2.race 已经调用，此时如果再次调用 result.current.updateCount
    // 看是否能取消掉 p1
    // 预期是能取消掉
    act(() => {
      result.current.updateCount(3);
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(3);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(result.current.age).toBe(4);
    expect(onUpdate_0.mock.calls.length).toBe(4);

    if (p1) {
      console.log('p1: 进来啦 X3');
      await p1.catch((e) => console.log('p1: ', e));
      p1 = undefined;
      expect(model_2()).toBe(2);
    }

    if (p0) {
      console.log('p0: 进来啦 X4');
      await p0;
      p0 = undefined;
      expect(model_1()).toBe(4);
      expect(onUpdate_1.mock.calls.length).toBe(4);
    }

    if (p1) {
      console.log('p1: 进来啦 X4');
      await p1;
      p1 = undefined;
      expect(model_2()).toBe(3);
    }


    act(() => {
      unmount();
    });

    unmount_1();
  });

  test('useModel autoLoad', async () => {


    const service = jest.fn((s: number, data?: number) => {
      if (typeof data === 'number') return data;
      return s + 1;
    });

    const { result, unmount } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const [age,, {
        service: ageService,
      }] = useModel(0, service as Service<number>, [count], {
        autoLoad: false,
      });

      return {
        age,
        ageService,
        count,
        updateCount
      }
    });

    expect(result.current.count).toBe(0);
    expect(result.current.age).toBe(0);
    expect(service.mock.calls.length).toBe(0);

    act(() => {
      result.current.updateCount((cnt) => cnt + 1);
    });

    expect(result.current.count).toBe(1);
    expect(result.current.age).toBe(0);
    expect(service.mock.calls.length).toBe(0);

    act(() => {
      result.current.ageService(100)
    })

    expect(result.current.count).toBe(1);
    expect(result.current.age).toBe(100);
    expect(service.mock.calls.length).toBe(1);

    act(() => {
      unmount();
    })
  })
});
