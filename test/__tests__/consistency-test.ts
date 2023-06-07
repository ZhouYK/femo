import * as familyModel from '../models/family';

familyModel.papa({
  name: '小李'
});


test('Data consistency and integrity tests', () => {
  const name = '小刘';
  const papa = familyModel.papa();
  expect(papa).toEqual({
    name: '小李',
  });
  familyModel.papa({ name });

  const papa1 = familyModel.papa();
  expect(papa1).toEqual({
    name: '小刘',
  });

  expect(Object.is(papa, papa1)).toBe(false);

  const newMama = {
    name: '小黄',
    age: 3
  };

  const mama = familyModel.mama();
  expect(mama).toEqual({
    name: 'mama`s name',
    age: 'mama`s age',
    job: '律师'
  })

  const result = familyModel.mama(newMama);
  expect(Object.is(result, newMama )).toBe(false);

  const mama1 = familyModel.mama();
  expect(result).toBe(mama1);

  expect(mama1).toEqual({
    name: '小黄',
    age: 3,
  });

  expect(Object.is(mama, mama1)).toBe(false);

  const pets = familyModel.pets();
  expect(pets).toEqual({
    name: 'pets`s name',
    age: 'pets`s age'
  });

  familyModel.pets({
    name: '小胖',
    age: 1,
  });

  const pets1 = familyModel.pets();
  expect(pets1).toEqual({
    name: '小胖',
    age: 1,
  });
  expect(Object.is(pets1, pets)).toBe(false);
});
