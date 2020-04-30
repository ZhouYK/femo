import React, {FC, useCallback, useEffect, useState} from "react";
import store from "../store";
import {Profile} from "../interface";
let count = 0;
const profileRaceQueue = store.genRaceQueue();

const Profile: FC = () => {
  const [profile, setProfile] = useState({ name: '空', desc: '空', id: '空' });

  const fetchProfile = useCallback((order: number) => {
    const profiles = [{
      name: '张三',
      desc: '守法好公民',
      id: '1'
    }, {
      name: '李四',
      desc: '犯罪分子',
      id: '2',
    }, {
      name: '王二',
      desc: '人民警察',
      id: '3'
    }];
    const id = 'id';
    profileRaceQueue.push(store.model.profile(id, async () => {
      const index = Math.floor(Math.random() * 3);
      console.log('order', order, profiles[index]);
      return await new Promise((resolve) => {
        setTimeout(() => {
          resolve(profiles[index]);
        }, 5000 * (1 / order));
      })
    }));
    console.log('queue', profileRaceQueue.__UNSAFE__getQueue());
  }, []);

  useEffect(() => {
    fetchProfile(count);
    return store.subscribe([store.model.profile], (profile: Profile) => {
      setProfile(profile);
    });
  }, []);

  console.log('queue render', profileRaceQueue.__UNSAFE__getQueue());
  return (
    <section>
      <section>
        <h2>个人信息</h2>
        <button onClick={() => { const order = count + 1; count = order; fetchProfile(order) }}>next</button>
      </section>
      <section>
        <span>名字：</span><h4>{ profile.name }</h4>
      </section>
      <section>
        <span>描述：</span>
        <p>{ profile.desc }</p>
      </section>
    </section>
  )
};

export default Profile;
