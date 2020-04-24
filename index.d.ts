import { Femo } from "./src/interface";

// gluer
export type HandleFunc<S, D, CR = Partial<S> | Promise<Partial<S>>> = (data: D, state: S) => CR;

type fnc<S, R> = <D = Partial<S>, CR = R>(data: D, customHandler?: HandleFunc<S, D, CR>) => CR;
export type GluerReturn<S, R>  = {
  readonly [P in keyof S]: S[P];
} & fnc<S, R> & {
  actionType: string
};

export function gluer<S, D = S, R = Partial<S>>(onlyOne: HandleFunc<S, D, R> | S) : GluerReturn<S, R>;
export function gluer<S, D = S, R = Partial<S>>(fn:  HandleFunc<S, D, R>, initialState: S) : GluerReturn<S, R>;
export default function femo<T>(structure: T): Femo<T>;

export { Connect, ConnectPlugin, ConnectRegister, Femo } from './src/interface';
