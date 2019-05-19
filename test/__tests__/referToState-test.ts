import family from '../models/family';
import femo  from '../../src'

const store = femo({
  family
});

test('referToState test', () => {
  // @ts-ignore
  const family_1 = store.referToState(store.model.family);
  expect(family_1.count).toBe(3);

  // @ts-ignore
  const papa_1 = store.referToState(store.model.family.papa);
  expect(papa_1.job).toBe('法官');

  // @ts-ignore
  const mama_1 = store.referToState(store.model.family.mama);

  // @ts-ignore
  const papa_1_name = store.referToState(store.model.family.papa.name);
  expect(papa_1_name).toBe('张三');


  // @ts-ignore
  store.model.family.papa.name('李四');
  // @ts-ignore
  expect(store.referToState(store.model.family.papa.name)).toBe('蓝色的李四');

  // @ts-ignore
  const papa_2 = store.referToState(store.model.family.papa);
  expect(Object.is(papa_1, papa_2)).toBe(false);

  // @ts-ignore
  const mama_2 = store.referToState(store.model.family.mama);
  expect(mama_1).toBe(mama_2);
  expect(mama_1).toEqual(mama_2);

});

