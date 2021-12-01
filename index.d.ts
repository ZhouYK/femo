
// gluer
import {DependencyList, FC} from "react";
import {DerivedSpace} from "./src/hooks/rareHooks/useBatchDerivedStateToModel";
import {RacePromise} from "./src/genRaceQueue";


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
  <D = Partial<S>, CR = S>(data: D, customHandler: HandleFunc<S, D, CR>, mutedDeps: GluerReturn<any>[][]): CR extends Promise<any> ? Promise<S> : S;
}

export interface ModelStatus {
  loading: boolean;
  successful: boolean; // 用于判断promise是否fullfilled了，true代表fullfilled，false则可能是reject、可能还未开始。
}

export interface ServiceControl extends ModelStatus{
}

export type Service<T> = (state: T) => Promise<T> | T;

export interface ServiceOptions<S = any> {
  suspenseKey?: string; // 非空字符串
  cache?: boolean; // 是否开启节点的缓存（只针对异步数据有效，底层调用的model.cache）
  onChange?: (nextState: S, prevState: S) => void; // 节点数据变更时向外通知，一般对组件外使用（组件内的有useDerivedxxx系列）
  control?: GluerReturn<ServiceControl>; //
}

export type RaceFn<S> = {
  <D = undefined>(customHandler: HandleFunc<S, D, Promise<S>>): Promise<S>;
  <D = Partial<S>>(data: D, customHandler: HandleFunc<S, D, Promise<S>>): Promise<S>;
  <D = Partial<S>>(data: D, customHandler: HandleFunc<S, D, Promise<S>>, mutedDeps: GluerReturn<any>[][]): Promise<S>;
}

export type CacheFn<S> = {
  (): S;
  <D = undefined>(customHandler: HandleFunc<S, D, Promise<S>>): Promise<S>;
  <D = Partial<S>>(data: D, customHandler: HandleFunc<S, D, Promise<S>>): Promise<S>;
  <D = Partial<S>>(data: D, customHandler: HandleFunc<S, D, Promise<S>>, mutedDeps: GluerReturn<any>[][]): Promise<S>;
}

export type ModelMethod<S> = {
  reset: () => void;
  relyOn: <T extends GluerReturn<any>[]>(model: T, callback: (data: Copy<T>, state: S ) => S | Promise<S>) => () => void;
  /**
   * 请使用relyOff
   * @param deps
   * @deprecated
   */
  off: (deps?: GluerReturn<any>[]) => void;
  relyOff: (deps?: GluerReturn<any>[]) => void;
  onChange: (callback: (state: S) => void) => () => void;
  offChange: (callback?: (state: S) => void) => void;
  silent: GluerReturnFn<S>;
  track: () => void;
  flush: () => void;
  go: (step: number) => S;
  race: RaceFn<S>;
  preTreat: GluerReturnFn<S>;
  cache: CacheFn<S>;
  cacheClean: () => void;
};

export type GluerReturn<S> = GluerReturnFn<S> & ModelMethod<S>;

export type EnhancedCallback<F extends (...args: any[]) => any> = F & {
  renew: () => void;
};

export interface InjectProps {
  suspenseKeys: string[];
}

export type Callback = (...args: any[]) => void;

export function gluer<S, D = any, R = any>(fn: HandleFunc<S, D, R>) : GluerReturn<S>;
export function gluer<S, D = any>(initialState: S) : GluerReturn<S>;
export function gluer<S , D = any, R = any>(fn:  HandleFunc<S, D, R>, initialState: S) : GluerReturn<S>;

export const promiseDeprecatedError: string;

export function genRaceQueue(): ({ push: <T = any>(p: RacePromise) => void; clear: () => void; destroy: () => void; __UNSAFE__getQueue: () => (Promise<any>[]) | null })
export function subscribe(deps: GluerReturn<any>[], callback: (...args: any[]) => void, callWhenSub?: boolean): () => void;
export function useModel<T = any, D = any>(model: GluerReturn<T>, deps?: [Service<T>], options?: ServiceOptions<T>): [T, GluerReturn<T>, ModelStatus];
export function useDerivedStateToModel<P = any, S = any>(source: P, model: GluerReturn<S>, callback: (nextSource: P, prevSource: P, state: S) => S, perf?: boolean): [S];
export function useIndividualModel<S = any>(initState: S | (() => S), deps?: [Service<S>], options?: ServiceOptions<S>): [S, GluerReturn<S>, GluerReturn<S>, ModelStatus];
export function useDerivedModel<S = any, P = any>(initState: S | (() => S), source: P, callback: (nextSource: P, prevSource: P, state: S) => S): [S, GluerReturn<S>, GluerReturn<S>, ModelStatus];
export function useBatchDerivedModel<S, D extends DerivedSpace<S, any>[]>(initState: S | (() => S), ...derivedSpace: D): [S, GluerReturn<S>, GluerReturn<S>, ModelStatus];
export function useBatchDerivedStateToModel<S , D extends DerivedSpace<S, any>[]>(model: GluerReturn<S>, ...derivedSpace: D): [S];
export function useEnhancedCallback<T extends (...args: any) => any>(callback: T, deps: DependencyList): EnhancedCallback<T>;
export function useDerivedStateWithModel<S = any>(mode: GluerReturn<S>, callback: (state: S) => S, deps: any[], callWhenInitial?: boolean): [S];

export function useDerivedState<S = any>(initState: S | (() => S), callback: (state: S) => S, deps: any[]): [S, GluerReturn<S>, GluerReturn<S>, ModelStatus];
export function useDerivedState<S = any>(callback: (state: S) => S, deps: any[]): [S, GluerReturn<S>, GluerReturn<S>, ModelStatus];

export function useSubscribe(deps: GluerReturn<any>[], callback: (...args: any[]) => void, callWhenSub?: boolean): void;

export function Inject<P extends InjectProps>(WrappedComponent: FC<P>): (count: number) => FC<Omit<P, 'suspenseKeys'>>;
