import { Femo } from "./src/interface";

// gluer
export type HandleFunc<D, S = D, R = S> = (data: {[P in keyof D]?: D[P] }, state: S) => R;

type fnc<D, S, R = Promise<S> | S> = (data?: {[P in keyof D]?: D[P] }, customHandler?: HandleFunc<D, S, R>) => R
export type GluerReturn<S, D = S>  = {
  readonly [P in keyof S]: S[P];
} & fnc<D, S> & {
  actionType: string
};

export function gluer<D, S = D>(onlyOne: HandleFunc<D, S> | D) : GluerReturn<D, S>;
export function gluer<D, S = D>(fn: HandleFunc<D, S>, initialState: D) : GluerReturn<D, S>;
export default function femo<T>(structure: T): Femo<T>;

export { Connect, ConnectPlugin, ConnectRegister, Femo } from './src/interface';
