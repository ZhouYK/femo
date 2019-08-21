export enum Status {
    DEFAULT = 'default',
    EDIT = 'edit',
}
export interface User {
    name: string;
    id: string;
    avatar?: string;
    status?: Status;
}

export interface Users {
    list: User[];
    total: number;
}
