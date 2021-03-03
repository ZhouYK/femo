
// gluer
import {raceQueue} from "./src/constants";
import {RaceQueue} from "./src/interface";


export type Unpacked<T> = T extends Promise<infer U> ? U : T;
export type isType<T, S> = T extends S ? Unpacked<T> : never;
type Transfer<T> = T extends GluerReturn<any, any> ? Unpacked<ReturnType<T>> : never;
type Copy<T> = {
  [key in keyof T]: Transfer<T[key]>;
}

export type HandleFunc<S, D, CR> = (data: D, state: S) => CR;

export type GluerReturnFn<S, R> = {
  (): S;
  <D = undefined>(customHandler: HandleFunc<S, D, Promise<Partial<S>>>): Promise<Partial<S>>;
  <D = undefined>(customHandler: HandleFunc<S, D, Partial<S>>): Partial<S>;
  <D = Partial<S>>(data: D): S;
  <D = Partial<S>>(data: D, customHandler: HandleFunc<S, D, Partial<S>>): Partial<S>;
  <D = Partial<S>>(data: D, customHandler: HandleFunc<S, D, Promise<Partial<S>>>): Promise<Partial<S>>;
}

export type GluerReturn<S, R> = GluerReturnFn<S, R> & {
  reset: () => void;
  relyOn: <T extends GluerReturn<any, any>[]>(model: T, callback: (data: Copy<T>, state: S ) => S | Promise<S>) => () => void;
  silent: GluerReturnFn<S, R>;
  track: () => void;
  flush: () => void;
  go: (step: number) => S;
}
export function gluer<S = any, D = S, R = Partial<S>>(fn: HandleFunc<S, D, R>) : GluerReturn<S, R>;
export function gluer<S, D, R = any>(initialState: S) : GluerReturn<S, R>;
export function gluer<S = any, D = S, R = Partial<S>>(fn:  HandleFunc<S, D, R>, initialState: S) : GluerReturn<S, R>;

export function genRaceQueue(): ({ push: <T = any>(p: Promise<T> & { [raceQueue]?: RaceQueue }) => void; clear: () => void; destroy: () => void; __UNSAFE__getQueue: () => (Promise<any>[]) | null })
export function subscribe(deps: GluerReturn<any, any>[], callback: (...args: any[]) => void, callWhenSub?: boolean): () => void;

export { promiseDeprecatedError } from './src/gluer';
