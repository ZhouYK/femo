import family from '../models/family';
import destruct from '../../src';

const store = destruct({
  family
});

test('hasModel test', () => {
  // @ts-ignore
  expect(store.hasModel(store.model)).toBe(true);
  // @ts-ignore
  expect(store.hasModel(store.model.family)).toBe(true);

  // 非结构节点的直接量，不会被追踪
  // @ts-ignore
  expect(store.hasModel(store.model.family.count)).toBe(false);

  // @ts-ignore
  expect(store.hasModel(store.model.family.papa)).toBe(true);

  // @ts-ignore
  expect(store.hasModel(store.model.family.papa.job)).toBe(false);
});
