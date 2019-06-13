import { Femo } from "./src/interface";
// gluer
export type HandleFunc<S, D = S> = (data: D, state: S) => S;

type fnc<D> = (data?: D) => D;
export type GluerReturn<S, D = S>  = S & {
  readonly [P in keyof S]: S[P];
} & fnc<D> & {
  actionType: string
};

export function gluer<S, D = S>(onlyOne: HandleFunc<S, D> | S) : GluerReturn<S, D>;
export function gluer<S, D = S>(fn: HandleFunc<S, D>, initialState: S) : GluerReturn<S, D>;
export default function femo<T>(structure: T): Femo<T>;

export { Connect, ConnectPlugin, ConnectRegister, Femo } from './src/interface';
