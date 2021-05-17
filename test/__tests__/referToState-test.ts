import family from '../models/family';
import femo  from '../../src'

const store = femo({
  family
});

test('referToState test', () => {
  const family_1 = store.referToState(store.model.family);
  expect(family_1.count).toBe(3);

  const papa_1 = store.referToState(store.model.family.papa);
  expect(papa_1.job).toBe('法官');

  const mama_1 = store.referToState(store.model.family.mama);

  const papa_1_name = store.referToState(store.model.family.papa.name);
  expect(papa_1_name).toBe('张三');


  store.model.family.papa.name('李四');
  expect(store.referToState(store.model.family.papa.name)).toBe('蓝色的李四');

  const papa_2 = store.referToState(store.model.family.papa);
  expect(Object.is(papa_1, papa_2)).toBe(false);

  const mama_2 = store.referToState(store.model.family.mama);
  expect(mama_1).toBe(mama_2);
  expect(mama_1).toEqual(mama_2);

  const pets = store.referToState(store.model.family.pets);
  expect(pets).toEqual({
    name: '张三',
    age: 10
  });
  store.model.family.pets({
    age: 20
  });
  expect(store.referToState(store.model.family.pets)).toEqual({
    name: '张三',
    age: 200
  });

});

