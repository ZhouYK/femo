import React, {FC} from 'react';
import List from "./List";
import Profile from "./Profile";

const Pannel: FC = () => {

  return (
    <section style={{ display: 'flex' }}>
      <section style={{ flex:  '0 1 auto'}}>
        <List />
      </section>
      <section>
        <Profile />
      </section>
    </section>
  )
}

export default Pannel;
