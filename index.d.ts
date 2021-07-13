
// gluer
import {DependencyList} from "react";
import {raceQueue} from "./src/constants";
import {RaceQueue} from "./src/interface";
import {DerivedSpace} from "./src/hooks/legacyHooks/useBatchDerivedStateToModel";


export type Unpacked<T> = T extends Promise<infer U> ? U : T;
export type isType<T, S> = T extends S ? Unpacked<T> : never;
type Transfer<T> = T extends (...args: any) => any ? Unpacked<ReturnType<T>> : never;
type Copy<T> = {
  [key in keyof T]: Transfer<T[key]>;
}

export type HandleFunc<S, D, CR> = (data: D, state: S) => CR;

export type GluerReturnFn<S> = {
  (): S;
  <D = undefined, CR = S>(customHandler: HandleFunc<S, D, CR>): CR extends Promise<any> ? Promise<S> : S;
  <D>(data: D): D extends Promise<any> ? Promise<S> : S;
  <D = Partial<S>, CR = S>(data: D, customHandler: HandleFunc<S, D, CR>): CR extends Promise<any> ? Promise<S> : S;
}

export type Service<T> = (state: T) => Promise<T> | T;

export type RaceFn<S> = {
  <D = undefined, CR = S>(customHandler: HandleFunc<S, D, CR>): Promise<S>;
  <D = Partial<S>, CR = S>(data: D, customHandler: HandleFunc<S, D, CR>): Promise<S>;
}

export type GluerReturn<S> = GluerReturnFn<S> & {
  reset: () => void;
  relyOn: <T extends GluerReturn<any>[]>(model: T, callback: (data: Copy<T>, state: S ) => S | Promise<S>) => () => void;
  off: () => void;
  silent: GluerReturnFn<S>;
  track: () => void;
  flush: () => void;
  go: (step: number) => S;
  race: RaceFn<S>;
}

export interface ModelStatus {
  loading: boolean;
}

export type EnhancedCallback<F extends (...args: any[]) => any> = F & {
  renew: () => void;
};

export function gluer<S, D = any, R = S>(fn: HandleFunc<S, D, R>) : GluerReturn<S>;
export function gluer<S, D = any>(initialState: S) : GluerReturn<S>;
export function gluer<S , D = any, R = S>(fn:  HandleFunc<S, D, R>, initialState: S) : GluerReturn<S>;

export function genRaceQueue(): ({ push: <T = any>(p: Promise<T> & { [raceQueue]?: RaceQueue }) => void; clear: () => void; destroy: () => void; __UNSAFE__getQueue: () => (Promise<any>[]) | null })
export function subscribe(deps: GluerReturn<any>[], callback: (...args: any[]) => void, callWhenSub?: boolean): () => void;
export function useModel<T = any, D = any>(model: GluerReturn<T>, deps?: [Service<T>]): [T, GluerReturn<T>, ModelStatus];
export function useDerivedStateToModel<P = any, S = any>(source: P, model: GluerReturn<S>, callback: (nextSource: P, prevSource: P, state: S) => S, perf?: boolean): [S];
export function useIndividualModel<S = any>(initState: S | (() => S), deps?: [Service<S>]): [S, GluerReturn<S>, GluerReturn<S>, ModelStatus];
export function useDerivedModel<S = any, P = any>(initState: S | (() => S), source: P, callback: (nextSource: P, prevSource: P, state: S) => S): [S, GluerReturn<S>, GluerReturn<S>, ModelStatus];
export function useBatchDerivedModel<S, D extends DerivedSpace<S, any>[]>(initState: S | (() => S), ...derivedSpace: D): [S, GluerReturn<S>, GluerReturn<S>, ModelStatus];
export function useBatchDerivedStateToModel<S , D extends DerivedSpace<S, any>[]>(model: GluerReturn<S>, ...derivedSpace: D): [S];
export function useEnhancedCallback<T extends (...args: any) => any>(callback: T, deps: DependencyList): EnhancedCallback<T>;
export function useDerivedStateWithModel<S = any>(mode: GluerReturn<S>, callback: (state: S) => S, deps: any[]): [S];
export function useDerivedState<S = any>(initState: S | (() => S), callback: (state: S) => S, deps: any[]): [[S, GluerReturn<S>, GluerReturn<S>, ModelStatus]];
