export enum Status {
    DEFAULT = 'default',
    EDIT = 'edit',
}
export interface User {
    name: string;
    id: string;
    desc: string;
    avatar?: string;
    status?: Status;
}

export interface Users {
    list: User[];
    total: number;
}

export interface Profile extends Pick<User, 'name'|'id'|'desc'>{

}
