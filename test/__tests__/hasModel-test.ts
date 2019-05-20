import family from '../models/family';
import destruct from '../../src';

const store = destruct({
  family
});

test('hasModel test', () => {

  expect(store.hasModel(store.model)).toBe(true);

  expect(store.hasModel(store.model.family)).toBe(true);

  // 非结构节点的直接量，不会被追踪

  expect(store.hasModel(store.model.family.count)).toBe(false);


  expect(store.hasModel(store.model.family.papa)).toBe(true);


  expect(store.hasModel(store.model.family.papa.job)).toBe(false);
});
