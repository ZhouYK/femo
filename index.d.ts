
// gluer
import {raceQueue} from "./src/constants";
import {RaceQueue} from "./src/interface";

export type HandleFunc<S, D, CR> = (data: D, state: S) => CR;

export type GluerReturn<S, R> = {
  (): S;
  <D = Partial<S>, CR = R>(data: D): CR;
  <D = Partial<S>>(data: D, customHandler: HandleFunc<S, D, Partial<S>>): Partial<S>;
  <D = undefined>(customHandler: HandleFunc<S, D, Partial<S>>): Partial<S>;
  <D = undefined>(customHandler: HandleFunc<S, D, Promise<Partial<S>>>): Promise<Partial<S>>;
  <D = Partial<S>>(data: D, customHandler: HandleFunc<S, D, Promise<Partial<S>>>): Promise<Partial<S>>;
} & {
  reset: () => void;
  relyOn: (model: GluerReturn<any, any> | GluerReturn<any, any>[], callback: (data: any | any[], state: S ) => S | Promise<S>) => () => void;
}
export function gluer<S = any, D = S, R = Partial<S>>(fn: HandleFunc<S, D, R>) : GluerReturn<S, R>;
export function gluer<S, D, R = any>(initialState: S) : GluerReturn<S, R>;
export function gluer<S = any, D = S, R = Partial<S>>(fn:  HandleFunc<S, D, R>, initialState: S) : GluerReturn<S, R>;

export function genRaceQueue(): ({ push: <T = any>(p: Promise<T> & { [raceQueue]?: RaceQueue }) => void; clear: () => void; destroy: () => void; __UNSAFE__getQueue: () => (Promise<any>[]) | null })
export function subscribe(deps: GluerReturn<any, any>[], callback: (...args: any[]) => void, callWhenSub?: boolean): () => void;

export { promiseDeprecatedError } from './src/gluer';
