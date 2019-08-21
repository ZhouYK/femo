import { Femo } from "./src/interface";

type Data<T = any> = T;

type Result<T = any> = T;

// gluer
export type HandleFunc<S, D, R = S> = (data: Data<D>, state: S) => R;

type fnc<S, D, R = Promise<S> | S> = (data?: Data<D>, customHandler?: HandleFunc<S, D, R>) => Result<R>
export type GluerReturn<S, D>  = {
    readonly [P in keyof S]: S[P];
} & fnc<S, D> & {
    actionType: string
};

export function gluer<S, D = any>(onlyOne: HandleFunc<S, D> | S) : GluerReturn<S, D>;
export function gluer<S, D = any>(fn: HandleFunc<S, D>, initialState: S) : GluerReturn<S, D>;
export default function femo<T>(structure: T): Femo<T>;

export { Connect, ConnectPlugin, ConnectRegister, Femo } from './src/interface';
