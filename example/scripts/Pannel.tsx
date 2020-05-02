import React, {FC} from 'react';
import List from "./List";
import Profile from "./Profile";

const Pannel: FC = () => {

  return (
    <section style={{ display: 'flex' }}>
      <section style={{ flex:  '0 1 50%', display: 'flex', justifyContent: 'center', }}>
        <List />
      </section>
      <section style={{ flex: '0 1 50%', display: 'flex', justifyContent: 'center' }}>
        <Profile />
      </section>
    </section>
  )
}

export default Pannel;
