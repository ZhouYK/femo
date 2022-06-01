import { renderHook, act } from '@testing-library/react-hooks';
import { useState } from 'react';
import {  useModel, useLocalService, gluer, useIndividualModel } from '../../src';

const model = gluer(0);
describe('useLocalService:useModel:test', () => {

  beforeEach(() => {
    model.reset();
  })


  test('useModel:useLocalService:basic', async () => {
    const { result, unmount, waitForNextUpdate } = renderHook(() => {

      const getAge = (s: number, data?: number) => {
        if (typeof data !== 'undefined') {
          return Promise.resolve(s + data);
        }
        return Promise.resolve(s + 1);
      }

      const [age, clonedModel, { loading, service }] = useModel(model, getAge);
      const [localService, { loading: localLoading }] = useLocalService(service);
      return {
        age,
        clonedModel,
        service,
        localService,
        loading,
        localLoading,
      }
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.age).toBe(0);
    expect(Object.is(result.current.service, result.current.localService)).toBe(false);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.age).toBe(1);

    act(() => {
      result.current.localService();
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(1);
    expect(result.current.localLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(2);
    expect(result.current.localLoading).toBe(false);

    act(() => {
      result.current.localService(10);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(2);
    expect(result.current.localLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(12);
    expect(result.current.localLoading).toBe(false);


    act(() => {
      unmount();
    });
  })

  test('useModel:useLocalService:bubble:true', async () => {
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const getAge = (s: number, data?: number) => {
        if (typeof data !== 'undefined') {
          return Promise.resolve(s + data);
        }
        return Promise.resolve(s + 1);
      }

      const [age, clonedModel, { loading, service }] = useModel(model, getAge, [count]);
      const [localService, { loading: localLoading }] = useLocalService(service, { bubble: true });
      return {
        age,
        clonedModel,
        service,
        localService,
        loading,
        localLoading,
        updateCount,
      }
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.age).toBe(0);
    expect(Object.is(result.current.service, result.current.localService)).toBe(false);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.age).toBe(1);

    act(() => {
      result.current.localService(2);
    })

    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(true);
    expect(result.current.age).toBe(1);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.age).toBe(3);

    act(() => {
      result.current.updateCount((prevState) => prevState + 1);
    })

    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.age).toBe(3);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.age).toBe(4);

    act(() => {
      unmount();
    });

  })

  test('useModel:useLocalService:race', async () => {
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const getAge = (s: number, data?: number) => {
        if (typeof data !== 'undefined') {
          return Promise.resolve(s + data);
        }
        return Promise.resolve(s + 1);
      }

      const [age, clonedModel, { loading, successful, service }] = useModel(model, getAge, [count]);
      const [localService, { loading: localLoading, successful: localSuccessful }] = useLocalService(service);
      return {
        age,
        clonedModel,
        service,
        localService,
        loading,
        successful,
        localSuccessful,
        localLoading,
        updateCount,
      }
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.localSuccessful).toBe(false);
    expect(result.current.age).toBe(0);
    act(() => {
      result.current.localService(10);
    });
    // 设置 false 是在异步回调里面，所以这还是 true
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localLoading).toBe(true);
    expect(result.current.localSuccessful).toBe(false);
    expect(result.current.age).toBe(0);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.localSuccessful).toBe(true);
    expect(result.current.age).toBe(10);

    act(() => {
      result.current.updateCount((prevState) => prevState + 1);
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.localSuccessful).toBe(true);
    expect(result.current.age).toBe(10);
    act(() => {
      result.current.localService(2);
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localLoading).toBe(true);
    expect(result.current.localSuccessful).toBe(false);
    expect(result.current.age).toBe(10);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.localSuccessful).toBe(true);
    expect(result.current.age).toBe(12);

    act(() => {
      result.current.localService(3);
    });
    expect(result.current.localLoading).toBe(true);
    expect(result.current.localSuccessful).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(12);
    act(() => {
      result.current.updateCount((prevState) => prevState + 1);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localLoading).toBe(true);
    expect(result.current.localSuccessful).toBe(false);
    expect(result.current.age).toBe(12);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.localSuccessful).toBe(false);
    expect(result.current.age).toBe(13);

    act(() => {
      unmount();
    });

  });

  test('useModel:useLocalService:race:bubble', async () => {
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const getAge = (s: number, data?: number) => {
        if (typeof data !== 'undefined') {
          return Promise.resolve(s + data);
        }
        return Promise.resolve(s + 1);
      }

      const [age, clonedModel, { loading, successful, service }] = useModel(model, getAge, [count]);
      const [localService, { loading: localLoading, successful: localSuccessful }] = useLocalService(service, {
        bubble: true,
      });
      return {
        age,
        clonedModel,
        service,
        localService,
        loading,
        successful,
        localSuccessful,
        localLoading,
        updateCount,
      }
    });

    await waitForNextUpdate();
    expect(result.current.age).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(result.current.localSuccessful).toBe(false);
    act(() => {
      result.current.localService(2);
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localSuccessful).toBe(false);
    expect(result.current.age).toBe(1);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(result.current.localSuccessful).toBe(true);
    expect(result.current.age).toBe(3);

    act(() => {
      result.current.updateCount((prevState) => prevState + 1);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.localSuccessful).toBe(true);
    expect(result.current.age).toBe(3);

    act(() => {
      result.current.localService(5);
    });
    expect(result.current.age).toBe(3);
    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localSuccessful).toBe(false);
    await waitForNextUpdate();
    expect(result.current.age).toBe(8);
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(result.current.localSuccessful).toBe(true);

    act(() => {
      result.current.localService(1);
    });
    expect(result.current.age).toBe(8);
    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localSuccessful).toBe(false);
    act(() => {
      result.current.localService(3);
    });
    expect(result.current.age).toBe(8);
    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.age).toBe(11);
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(result.current.localSuccessful).toBe(true);

    act(() => {
      unmount();
    });

  });
});
describe('useLocalService:useIndividualModel:test', () => {
  test('useIndividualModel:useLocalService:basic', async () => {
    const { result, unmount, waitForNextUpdate } = renderHook(() => {

      const getAge = (s: number, data?: number) => {
        if (typeof data !== 'undefined') {
          return Promise.resolve(s + data);
        }
        return Promise.resolve(s + 1);
      }

      const [age,, clonedModel, { loading, service }] = useIndividualModel(0, getAge);
      const [localService, { loading: localLoading }] = useLocalService(service);
      return {
        age,
        clonedModel,
        service,
        localService,
        loading,
        localLoading,
      }
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.age).toBe(0);
    expect(Object.is(result.current.service, result.current.localService)).toBe(false);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.age).toBe(1);

    act(() => {
      result.current.localService();
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(1);
    expect(result.current.localLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(2);
    expect(result.current.localLoading).toBe(false);

    act(() => {
      result.current.localService(10);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(2);
    expect(result.current.localLoading).toBe(true);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBe(12);
    expect(result.current.localLoading).toBe(false);


    act(() => {
      unmount();
    });
  })

  test('useIndividualModel:useLocalService:bubble:true', async () => {
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const getAge = (s: number, data?: number) => {
        if (typeof data !== 'undefined') {
          return Promise.resolve(s + data);
        }
        return Promise.resolve(s + 1);
      }

      const [age, , clonedModel, { loading, service }] = useIndividualModel(0, getAge, [count]);
      const [localService, { loading: localLoading }] = useLocalService(service, { bubble: true });
      return {
        age,
        clonedModel,
        service,
        localService,
        loading,
        localLoading,
        updateCount,
      }
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.age).toBe(0);
    expect(Object.is(result.current.service, result.current.localService)).toBe(false);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.age).toBe(1);

    act(() => {
      result.current.localService(2);
    })

    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(true);
    expect(result.current.age).toBe(1);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.age).toBe(3);

    act(() => {
      result.current.updateCount((prevState) => prevState + 1);
    })

    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.age).toBe(3);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.age).toBe(4);

    act(() => {
      unmount();
    });

  })

  test('useIndividualModel:useLocalService:race', async () => {
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const getAge = (s: number, data?: number) => {
        if (typeof data !== 'undefined') {
          return Promise.resolve(s + data);
        }
        return Promise.resolve(s + 1);
      }

      const [age, , clonedModel , { loading, successful, service }] = useIndividualModel(0, getAge, [count]);
      const [localService, { loading: localLoading, successful: localSuccessful }] = useLocalService(service);
      return {
        age,
        clonedModel,
        service,
        localService,
        loading,
        successful,
        localSuccessful,
        localLoading,
        updateCount,
      }
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.localSuccessful).toBe(false);
    expect(result.current.age).toBe(0);
    act(() => {
      result.current.localService(10);
    });
    // 设置 false 是在异步回调里面，所以这还是 true
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localLoading).toBe(true);
    expect(result.current.localSuccessful).toBe(false);
    expect(result.current.age).toBe(0);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.localSuccessful).toBe(true);
    expect(result.current.age).toBe(10);

    act(() => {
      result.current.updateCount((prevState) => prevState + 1);
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.localSuccessful).toBe(true);
    expect(result.current.age).toBe(10);
    act(() => {
      result.current.localService(2);
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localLoading).toBe(true);
    expect(result.current.localSuccessful).toBe(false);
    expect(result.current.age).toBe(10);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.localSuccessful).toBe(true);
    expect(result.current.age).toBe(12);

    act(() => {
      result.current.localService(3);
    });
    expect(result.current.localLoading).toBe(true);
    expect(result.current.localSuccessful).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.age).toBe(12);
    act(() => {
      result.current.updateCount((prevState) => prevState + 1);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localLoading).toBe(true);
    expect(result.current.localSuccessful).toBe(false);
    expect(result.current.age).toBe(12);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.localSuccessful).toBe(false);
    expect(result.current.age).toBe(13);

    act(() => {
      unmount();
    });

  });

  test('useIndividualModel:useLocalService:race:bubble', async () => {
    const { result, unmount, waitForNextUpdate } = renderHook(() => {
      const [count, updateCount] = useState(0);
      const getAge = (s: number, data?: number) => {
        if (typeof data !== 'undefined') {
          return Promise.resolve(s + data);
        }
        return Promise.resolve(s + 1);
      }

      const [age, , clonedModel, { loading, successful, service }] = useIndividualModel(0, getAge, [count]);
      const [localService, { loading: localLoading, successful: localSuccessful }] = useLocalService(service, {
        bubble: true,
      });
      return {
        age,
        clonedModel,
        service,
        localService,
        loading,
        successful,
        localSuccessful,
        localLoading,
        updateCount,
      }
    });

    await waitForNextUpdate();
    expect(result.current.age).toBe(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(result.current.localSuccessful).toBe(false);
    act(() => {
      result.current.localService(2);
    });
    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localSuccessful).toBe(false);
    expect(result.current.age).toBe(1);
    await waitForNextUpdate();
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(result.current.localSuccessful).toBe(true);
    expect(result.current.age).toBe(3);

    act(() => {
      result.current.updateCount((prevState) => prevState + 1);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.successful).toBe(false);
    expect(result.current.localSuccessful).toBe(true);
    expect(result.current.age).toBe(3);

    act(() => {
      result.current.localService(5);
    });
    expect(result.current.age).toBe(3);
    expect(result.current.loading).toBe(true);
    expect(result.current.localLoading).toBe(true);
    expect(result.current.successful).toBe(false);
    expect(result.current.localSuccessful).toBe(false);
    await waitForNextUpdate();
    expect(result.current.age).toBe(8);
    expect(result.current.loading).toBe(false);
    expect(result.current.localLoading).toBe(false);
    expect(result.current.successful).toBe(true);
    expect(result.current.localSuccessful).toBe(true);

    act(() => {
      unmount();
    });

  });
})
