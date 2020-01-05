import { Femo } from "./src/interface";

// gluer
export type HandleFunc<S, D, R = S> = (data: D, state: S) => R;

type fnc<S, R = Promise<S> | S> = <D>(data?: D, customHandler?: HandleFunc<S, D, R>) => R
export type GluerReturn<S>  = {
    readonly [P in keyof S]: S[P];
} & fnc<S> & {
    actionType: string
};

export function gluer<S, D = any>(onlyOne: HandleFunc<S, D> | S) : GluerReturn<S>;
export function gluer<S, D = any>(fn: HandleFunc<S, D>, initialState: S) : GluerReturn<S>;
export default function femo<T>(structure: T): Femo<T>;

export { Connect, ConnectPlugin, ConnectRegister, Femo } from './src/interface';
