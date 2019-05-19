import { gluer } from "../../src";

const name = gluer((data: string) => `蓝色的${data}`, '张三');

const age = gluer((data: number) => 10 * data, 10);


const papa = gluer((_data: any, state: any) => state, {
  name,
  age,
  job: '法官'
});

const mama = gluer((_data: any, state: any) => state, {
  name,
  age,
  job: '律师'
});

const pets = gluer((_data: any, state: any) => state, {
  name,
  age
});

const family = gluer((_data: any, state: any) => state, {
  count: 3,
  papa,
  mama,
  pets
});

export default family;
