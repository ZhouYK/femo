import { Femo } from "./src/interface";

// gluer
export type HandleFunc<D, S = D, R = S> = (data: D, state: S) => R;

type fnc<D, S, R = Promise<S> | S> = (data?: D, customHandler?: HandleFunc<D, S, R>) => R
export type GluerReturn<S, D = S>  = {
  readonly [P in keyof S]: S[P];
} & fnc<D, S> & {
  actionType: string
};

export function gluer<S, D = S>(onlyOne: HandleFunc<S, D> | S) : GluerReturn<S, D>;
export function gluer<S, D = S>(fn: HandleFunc<S, D>, initialState: S) : GluerReturn<S, D>;
export default function femo<T>(structure: T): Femo<T>;

export { Connect, ConnectPlugin, ConnectRegister, Femo } from './src/interface';
