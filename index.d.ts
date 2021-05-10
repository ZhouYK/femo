
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
  <D = undefined, CR = S>(customHandler: HandleFunc<S, D, CR>): CR extends Promise<any> ? Promise<S> : S;
  <D>(data: D): D extends Promise<any> ? Promise<S> : S;
  <D = Partial<S>, CR = S>(data: D, customHandler: HandleFunc<S, D, CR>): CR extends Promise<any> ? Promise<S> : S;
}

export type RaceFn<S> = {
  <D = undefined, CR = S>(customHandler: HandleFunc<S, D, CR>): Promise<S>;
  <D = Partial<S>, CR = S>(data: D, customHandler: HandleFunc<S, D, CR>): Promise<S>;
}

export type GluerReturn<S, R> = GluerReturnFn<S, R> & {
  reset: () => void;
  relyOn: <T extends GluerReturn<any, any>[]>(model: T, callback: (data: Copy<T>, state: S ) => S | Promise<S>) => () => void;
  silent: GluerReturnFn<S, R>;
  track: () => void;
  flush: () => void;
  go: (step: number) => S;
  race: RaceFn<S>;
}
export function gluer<S, D = any, R = S>(fn: HandleFunc<S, D, R>) : GluerReturn<S, R>;
export function gluer<S, D = any, R = S>(initialState: S) : GluerReturn<S, R>;
export function gluer<S , D = any, R = S>(fn:  HandleFunc<S, D, R>, initialState: S) : GluerReturn<S, R>;

export function genRaceQueue(): ({ push: <T = any>(p: Promise<T> & { [raceQueue]?: RaceQueue }) => void; clear: () => void; destroy: () => void; __UNSAFE__getQueue: () => (Promise<any>[]) | null })
export function subscribe(deps: GluerReturn<any, any>[], callback: (...args: any[]) => void, callWhenSub?: boolean): () => void;
export function useModel<T = any, D = any>(model: GluerReturn<T, D>, handleFnc?: (data: any) => any, resetWhenUnmount?: boolean): [T, (data: T) => void];
export function useDerivedStateToModel<P = any, S = any, R = any>(source: P, model: GluerReturn<S, R>, callback: (nextSource: P, prevSource: P, state: S) => S): [S];
export function useIndividualModel<S = any>(initState: S): [S, GluerReturn<S, any>];

export { promiseDeprecatedError } from './src/gluer';
