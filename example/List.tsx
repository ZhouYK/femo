import React from 'react';
import store from './store';
import {Status, User, Users} from "./interface";

class List extends React.Component {

    unsubscribe: () => void;

    // @ts-ignore
    state: { users: Users };

    constructor(props: any) {
        super(props);
        this.unsubscribe = store.subscribe([store.model.users], (users: Users) => {
            if (!this.state) {
                // eslint-disable-next-line react/no-direct-mutation-state
                this.state = {
                    users
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
            <li key={user.id}>
                { user.status === Status.EDIT ? (
                    <>
                        <input type="text" value={user.name} />
                        <button>confirm</button>
                    </>
                ) : (
                    <>
                        <img src={user.avatar} alt='avatar'/>
                        <span>{ user.name }</span>
                        <button>modify</button>
                        <button>delete</button>
                    </>
                ) }
            </li>
        )
    };

    addUser = (evt: HTMLInputElement) => {
        // @ts-ignore
        const name: string = evt.target.value;
        if (name) {
            store.model.users(name, (data, state) => {
                console.log(data, state);
                return state;
            })
        }

        function f<T>(a: T): T {
            return a;
        }
        var b = '123';
        const v = f(b);
        console.log(v);
    }

    render() {
        const { total, list } = this.state.users;
        return (
            <section>
                <section>
                    <input type="text" placeholder='input username'/>
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
