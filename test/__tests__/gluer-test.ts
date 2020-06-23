import gluer from '../../src/gluer';

describe('gluer normal test',  () => {
  test('gluer => function', () => {
    expect(gluer).toBeInstanceOf(Function);
  });

  test('gluer`s return => function', () => {
    const gr = gluer(0);
    expect(gr).toBeInstanceOf(Function);
  });
});
describe('gluer exception test', () => {
  test('when pass two arguments, but the first isn`t function', () => {
    // @ts-ignore
    expect(() => gluer('123', 123)).toThrow('first argument must be function');
  });
});
