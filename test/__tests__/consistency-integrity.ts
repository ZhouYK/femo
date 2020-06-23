import femo from '../../src';
import familyModel from '../models/family';

const store = femo({ family: familyModel });

// @ts-ignore
store.model.family({
  papa: {
    name: '小李'
  }
});


describe('Data consistency and integrity tests', () => {
  test('if one node has been udpated, the whole state will be update', () => {
    const name = '小刘';

    const state_1 = store.getState();

    expect(state_1).toBe(store.referToState(store.model));

    const result = store.model.family.papa.name(name);
    expect(result).toBe('蓝色的小刘');

    const state_2 = store.getState();

    expect(state_2).toBe(store.referToState(store.model));
    expect(Object.is(state_1, state_2)).toBe(false);


    expect(store.model.family.papa.name()).toBe(`蓝色的${name}`);
  });

  test('if one node has been updated, its parents will be also updated except its siblings', () => {
    const newPapa = {
      name: '小王',
      age: 3
    };

    const papa1 = store.model.family.papa();

    const mama1 = store.model.family.mama();

    const pets1 = store.model.family.pets();


    const result = store.model.family.papa(newPapa);
    expect(Object.is(result, newPapa )).toBe(false);
    expect(result).toBe(store.model.family.papa());
    expect(result).toEqual({
        name: '蓝色的小王',
        job: '法官',
        age: 30
    });


    const papa2 = store.model.family.papa();

    const mama2 = store.model.family.mama();

    const pets2 = store.model.family.pets();

    expect(papa2).toEqual({
      name: '蓝色的小王',
      age: 30,
      job: '法官'
    });

    expect(Object.is(papa1, papa2)).toBe(false);

    expect(Object.is(mama1, mama2)).toBe(true);

    expect(Object.is(pets1, pets2)).toBe(true);

  });

  test('nested model will be updated by call its reducer function and its descendants`s reducer functions', () => {
    const family = {
      pets: {
        name: '小狗'
      }
    };


    const family1 = store.model.family();

    const pets1 = store.model.family.pets();


    const result = store.model.family(family);
    expect(result).toBe(store.model.family());


    const family2 = store.model.family();

    const pets2 = store.model.family.pets();

    expect(family2).toEqual({
      ...family1,
      pets: {
        ...pets1,
        name: '蓝色的小狗'
      }
    });

    expect(pets2).toEqual({
      ...pets1,
      name: '蓝色的小狗'
    });

  });
});
