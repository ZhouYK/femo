import React  from 'react';
import { render } from 'react-dom';
import Pannel from "./scripts/Pannel";
import users from "./model/users";

render(<Pannel />, document.getElementById('bd'));

users({
  list: ['12'],
  total: 20,
});

console.log(users());
users.reset();

console.log(users());
