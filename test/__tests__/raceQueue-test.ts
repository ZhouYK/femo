import genRaceQueue, { promiseDeprecatedError } from "../../src/core/genRaceQueue";
import gluer from "../../src/core/gluer";

interface Profile {
  name: string;
  id: string;
  desc: string;
}


const game = gluer<Game>({
  price: 0,
  name: '',
});

interface Game {
  price: number;
  name: string;
}

const profile = gluer({
  id: '',
  name: '',
  desc: '',
});

describe('Correctness test', () => {
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

  const newGame_1 = {
    name: '超级马里奥',
    price: 10,
  };
  const newGame_2 = {
    name: '影子传说',
    price: 8.9,
  };

  let p1: Promise<any>;
  let p2: Promise<any>;

  beforeEach(() => {
    profile.reset();
    game.reset();

    expect(profile()).toEqual({
      id: '',
      name: '',
      desc: ''
    });
    expect(game()).toEqual({
      price: 0,
      name: '',
    });

    p1 = profile((_data, _state) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(newProfile_1)
        }, 2000);
      })
    });

    p2 = profile((_data, _state) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(newProfile_2)
        }, 1000);
      })
    });
  });

  test('no race promise', async () => {
    expect.assertions(3);
    await Promise.all([p1, p2]);
    expect(profile()).toBe(newProfile_1);
  });

  test('two race promises', async () => {
    const raceQueue = genRaceQueue();

    raceQueue.push(p1);
    raceQueue.push(p2);

    expect.assertions(10);

    try {
      await Promise.all([p1, p2]);
    } catch (e) {
      console.log('e', e);
      expect(profile()).toBe(newProfile_2);
      expect(e).toBe(promiseDeprecatedError);
      expect(p1).rejects.toBe(promiseDeprecatedError);
      expect(p2).resolves.toBe(newProfile_2);
    }

    const n1 = game.race((_data, _state) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(newGame_1)
        }, 2000);
      })
    });

    const n2 = game.race((_data, _state) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(newGame_2)
        }, 1000);
      })
    });
    try {
      await Promise.all([n1, n2]);
    } catch (e) {
      expect(game()).toBe(newGame_2);
      expect(e).toBe(promiseDeprecatedError);
      expect(n1).rejects.toBe(promiseDeprecatedError);
      expect(n2).resolves.toBe(newGame_2);
    }
  });

  test('three race promise', async () => {

    const p3 = profile(() => {
      return new Promise((_resolve, reject) => {
        setTimeout(() => {
          reject('something wrong');
        }, 500);
      })
    });

    const raceQueue = genRaceQueue();

    raceQueue.push(p1);
    raceQueue.push(p2);
    raceQueue.push(p3);

    expect.assertions(7);
    try {
      await Promise.all([p1, p2, p3]);
    } catch (e) {
      console.log('e', e);
      expect(p1).rejects.toBe(promiseDeprecatedError);
      expect(p2).rejects.toBe(promiseDeprecatedError);
      // 第三个p3的reject先触发
      expect(e).toBe('something wrong');
    }

    const n1 = game.race((_data, _state) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(newGame_1)
        }, 2000);
      })
    });

    const n2 = game.race((_data, _state) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(newGame_2)
        }, 1000);
      })
    });


    const n3 = game.race(() => {
      return new Promise((_resolve, reject) => {
        setTimeout(() => {
          reject('something wrong');
        }, 500);
      });
    });

    try {
      await Promise.all([n1, n2, n3]);
    } catch (e) {
      console.log('e', e);
      expect(n1).rejects.toBe(promiseDeprecatedError);
      expect(n2).rejects.toBe(promiseDeprecatedError);
      // 第三个n3的reject先触发
      expect(e).toBe('something wrong');
    }

    expect(profile()).toEqual({
      id: '',
      name: '',
      desc: ''
    });

    expect(game()).toEqual({
      price: 0,
      name: '',
    })
  })
});

