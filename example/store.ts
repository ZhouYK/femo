import femo from '../src';
import family from './models/family';

const store = femo({ family });

// @ts-ignore
store.model.family({
  papa: {
    name: '小李'
  }
});

// @ts-ignore
console.log(store.getState());

export default store;
