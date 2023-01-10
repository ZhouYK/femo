import { gluer } from "../../src";

export const name = gluer((_state, data: string) => `蓝色的${data}`, '张三');

export const age = gluer((_state, data: number) => 10 * data, 10);


export const papa = gluer((state: any, data: any) => {
  return {
    ...state,
    ...data,
  }
}, {
  name: 'papa`s name',
  age: 'papa`s age',
  job: '法官'
});

export const mama = gluer((state: any, data: any) => {

  return {
    ...state,
    ...data,
  }
}, {
  name: 'mama`s name',
  age: 'mama`s age',
  job: '律师'
});

export const pets = gluer((state: any, data: any) => {
  return {
    ...state,
    ...data,
  }
}, {
  name: 'pets`s name',
  age: 'pets`s age'
});
