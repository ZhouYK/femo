import { Femo } from "./src/interface";

// gluer
export type HandleFunc<S, D, CR> = (data: D, state: S) => CR;

interface fnc<S, R> {
  <D = undefined>(customHandler: HandleFunc<S, D, Promise<Partial<S>>>): Promise<Partial<S>>;
  <D = undefined>(customHandler: HandleFunc<S, D, Partial<S>>): Partial<S>;
  <D = Partial<S>, CR = R>(data: D): CR;
  <D = Partial<S>>(data: D, customHandler: HandleFunc<S, D, Promise<Partial<S>>>): Promise<Partial<S>>;
  <D = Partial<S>>(data: D, customHandler: HandleFunc<S, D, Partial<S>>): Partial<S>;
  (): S;
}

export type GluerReturn<S, R>  = {
  readonly [P in keyof S]: S[P];
} & fnc<S, R> & {
  actionType: string
};

export function gluer<S = any, D = S, R = Partial<S>>(fn: HandleFunc<S, D, R>) : GluerReturn<S, R>;
export function gluer<S, D, R = any>(initialState: S) : GluerReturn<S, R>;
export function gluer<S = any, D = S, R = Partial<S>>(fn:  HandleFunc<S, D, R>, initialState: S) : GluerReturn<S, R>;
export default function femo<T>(structure: T): Femo<T>;

export { Connect, ConnectPlugin, ConnectRegister, Femo } from './src/interface';
export { promiseDeprecatedError } from './src/glueAction';
