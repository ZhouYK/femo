import React, {ChangeEvent} from 'react';
import store from '../store';
import {Status, User, Users} from "../interface";
// @ts-ignore
import avatar from '../assets/avatar.jpeg';

interface State {
    users: Users;
    name: string;
}

class List extends React.Component<any, State> {

    unsubscribe: () => void;

    constructor(props: any) {
        super(props);
        this.unsubscribe = store.subscribe([store.model.users, store.model], (users) => {
          if (!this.state) {
                // eslint-disable-next-line react/no-direct-mutation-state
                this.state = {
                    users,
                    name: ''
                }
            } else {
                this.setState({
                    users
                })
            }
        });
    }

    componentWillUnmount(): void {
        this.unsubscribe();
    }

    renderLi = (user: User) => {
        return (
            <li key={user.id} style={{ marginTop: 16, marginBottom: 16 }}>
                { user.status === Status.EDIT ? (
                    <>
                        <input type="text" onChange={this.handleChange(user)} value={user.name} />
                        <button onClick={this.confirm(user)}>confirm</button>
                    </>
                ) : (
                    <>
                        <img style={{ width: 40, height: 40 }} src={user.avatar || avatar} alt='avatar'/>
                        <span style={{marginLeft: 16, marginRight: 16,}}>{ user.name }</span>
                        <button onClick={this.markUserEdit(user)}>modify</button>
                        <button onClick={this.deleteUser(user)}>delete</button>
                    </>
                ) }
            </li>
        )
    };

    handleChange = (user: User) => (evt: ChangeEvent<HTMLInputElement>) => {
        const name = evt.target.value;
        store.model.users(user, (data, state) => {
            data.name = name;
            return { ...state };
        })
    };

    addUser = (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        evt.preventDefault();
        const { name } = this.state;
        if (name) {
            store.model.users(name, (data, state) => {
                const newUser: User = {
                    name: data,
                    id: `${Date.now()}${Math.random()}`,
                    avatar: '',
                    status: Status.DEFAULT
                };
                const total = state.total + 1;
                state.list.unshift(newUser);
                return { ...state, total };
            })
        }
    };

    markUserEdit = (user: User) => (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        evt.preventDefault();
        store.model.users(user, (data, state) => {
            data.status = Status.EDIT;
            return { ...state }
        })
    };

    confirm = (user: User) => (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        evt.preventDefault();
        store.model.users(user, (data, state) => {
            data.status = Status.DEFAULT;
            return { ...state };
        })
    };

    deleteUser = (user: User) => (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      evt.preventDefault();
      store.model.users(user, (data, state) => {
          const { list, total } = state;
          let index;
          list.find((us: User, i: number) => {
              const flag = (us.id === data.id);
              if (flag) {
                  index = i;
              }
              return flag;
          });
          if (index !== undefined) {
              list.splice(index, 1);
              return { ...state, total: total - 1 }
          }
          return state;
      })
    };

    handleNameInput = (evt: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            name: evt.target.value
        });
    };

    render() {
        const { total, list } = this.state.users;
        return (
            <section style={{marginLeft: 'auto', marginRight: 'auto', width: 400}}>
                <section>
                    <input type="text" value={this.state.name} onChange={this.handleNameInput} placeholder='input username'/>
                    <button onClick={this.addUser}>submit</button>
                </section>
                <h3>Total：{ total }</h3>
                <ul>
                    {
                        list.map((user: User) => {
                            return this.renderLi(user);
                        })
                    }
                </ul>
            </section>
        )
    }
};

export default List;
