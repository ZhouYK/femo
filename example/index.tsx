import React  from 'react';
import { render } from 'react-dom';
import Pannel from './scripts/Pannel';
import KeyTest from './scripts/KeyTest';
import users from './model/users';

render(<Pannel />, document.getElementById('bd'));

render(<KeyTest />, document.getElementById('test'));
users({
  list: ['12'],
  total: 20,
});

console.log(users());
users.reset();

console.log(users());
