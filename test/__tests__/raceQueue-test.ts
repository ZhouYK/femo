import femo from '../../src';
import profile from "../../example/model/profile";
import {Profile} from "../../example/interface";
import {promiseDeprecatedError} from "../../src/glueAction";



describe('Correctness test', () => {
  let store = femo({
    profile,
  });

  const newProfile_1: Profile = {
    name: '小明',
    desc: '五道杠',
    id: '1',
  };
  const newProfile_2: Profile = {
    name: '小红',
    desc: '三道杠',
    id: '2',
  };

  let p1: Promise<any>;
  let p2: Promise<any>;

  beforeEach(() => {
    store = femo({
      profile,
    });
    p1 = store.model.profile((_data, _state) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(newProfile_1)
        }, 2000);
      })
    });

    p2 = store.model.profile((_data, _state) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(newProfile_2)
        }, 1000);
      })
    });
  });

  test('no race promise', async () => {
    expect.assertions(1);
    await Promise.all([p1, p2]);

    expect(store.referToState(store.model.profile)).toBe(newProfile_1);
  });

  test('two race promises', async () => {
    const raceQueue = store.genRaceQueue();

    raceQueue.push(p1);
    raceQueue.push(p2);

    expect.assertions(4);
    try {
      await Promise.all([p1, p2]);
    } catch (e) {
      console.log('e', e);
      expect(store.referToState(store.model.profile)).toBe(newProfile_2);
      expect(e).toBe(promiseDeprecatedError);
      expect(p1).rejects.toBe(promiseDeprecatedError);
      expect(p2).resolves.toBe(newProfile_2);
    }
  });

  test('three race promise', async () => {

    const p3 = store.model.profile(() => {
      return new Promise((_resolve, reject) => {
        setTimeout(() => {
          reject('something wrong');
        }, 500);
      })
    });

    const raceQueue = store.genRaceQueue();

    raceQueue.push(p1);
    raceQueue.push(p2);
    raceQueue.push(p3);

    expect.assertions(2);
    try {
      await Promise.all([p1, p2, p3]);
    } catch (e) {
      console.log('e', e);
      expect(e).toBe('something wrong');
    }

    expect(store.referToState(store.model.profile)).toEqual({
      id: '',
      name: '',
      desc: ''
    });

  })
});

