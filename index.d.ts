// gluer
import {FC} from 'react';
import {DerivedSpace} from './src/hooks/rareHooks/useBatchDerivedStateToModel';
import {
  promiseDeprecated,
  promiseDeprecatedFromClonedModel,
  promiseDeprecatedFromLocalService, promiseDeprecatedFromLocalServicePure,
  pureServiceKey
} from './src/constants';
import {ErrorFlag} from './src/genRaceQueue';


export type Unpacked<T> = T extends Promise<infer U> ? U : T;
export type isType<T, S> = T extends S ? Unpacked<T> : never;
type Transfer<T> = T extends (...args: any) => any ? Unpacked<ReturnType<T>> : never;
type Copy<T> = {
  [key in keyof T]: Transfer<T[key]>;
}

export interface ExceptionJudge {
  (): boolean;
}

export interface ManualException {
  tryThrow: () => void;
}

export type HandleFunc<S, D, CR> = (data: D, state: S) => CR;

export type GluerReturnFn<S> = {
  (): S;
  <D = undefined, CR = S>(customHandler: HandleFunc<S, D, CR>): CR extends Promise<any> ? Promise<S> : S;
  <D>(data: D): D extends Promise<any> ? Promise<S> : S;
  <D = Partial<S>, CR = S>(data: D, customHandler: HandleFunc<S, D, CR>): CR extends Promise<any> ? Promise<S> : S;
  <D = Partial<S>, CR = S>(data: D, customHandler: HandleFunc<S, D, CR>, mutedDeps: GluerReturn<any>[][]): CR extends Promise<any> ? Promise<S> : S;
}

export type Service<T, D = any> = (state: T, data?: D) => Promise<T> | T;

// Service 与 LocalService 返回保持一致
// LocalService 内部默认会调用 Service
// LocalService 是给外部使用的，所以返回是一个确定的 Promise<S>
export type LocalService<S, D = any> = {
  (data?: D): Promise<S>;
}

export interface ServiceStatus<S, D = any> {
  loading: boolean;
  successful: boolean; // 用于判断promise是否fullfilled了，true代表fullfilled，false则可能是reject、可能还未开始。
  service:  LocalService<S, D>;
}

export type LocalServiceHasStatus<T> = LocalService<T> & { [pureServiceKey]?: LocalService<T> };

export interface ServiceControl<D = any> extends Omit<ServiceStatus<D>, 'service'>{
  data?: D;
  key?: string; // 用来表明control的用途，消费方可根据此标识来决定是否消费数据及状态
}

export interface SuspenseOptions {
  key: string;
  persist?: boolean;
}

export interface ServiceOptions<S = any> {
  /** @deprecated
   *  please use suspense.key
   * */
  suspenseKey?: string; // 非空字符串
  suspense?: SuspenseOptions;
  onChange?: (nextState: S, prevState: S) => void; // 节点数据变更时向外通知，一般对组件外使用（组件内的有useDerivedxxx系列）
  control?: GluerReturn<ServiceControl>; // 外部传入的 model 用于同步状态
}

export type RaceFn<S> = {
  <D = undefined>(customHandler: HandleFunc<S, D, Promise<S>>): Promise<S>;
  <D = Partial<S>>(data: D, customHandler: HandleFunc<S, D, Promise<S>>): Promise<S>;
  <D = Partial<S>>(data: D, customHandler: HandleFunc<S, D, Promise<S>>, mutedDeps: GluerReturn<any>[][]): Promise<S>;
}

export type ModelMethod<S> = {
  reset: () => void;
  watch: <T extends GluerReturn<any>[]>(model: T, callback: (data: Copy<T>, state: S ) => S | Promise<S>) => () => void;
  onChange: (callback: (state: S) => void) => () => void;
  silent: GluerReturnFn<S>;
  race: RaceFn<S>;
  __race__?: RaceFn<S>;
  preTreat: GluerReturnFn<S>;
};

export type GluerReturn<S> = GluerReturnFn<S> & ModelMethod<S>;

export interface InjectProps {
  suspenseKeys: string[];
}

export interface IndividualServiceOptions {
  bubble?: boolean;
}

export type RacePromise = Promise<any> & {[promiseDeprecated]?: boolean; [promiseDeprecatedFromClonedModel]?: boolean; [promiseDeprecatedFromLocalService]?: boolean; [promiseDeprecatedFromLocalServicePure]?: boolean };

export interface RaceQueueObj {
  push: <T = any>(p: RacePromise, customerErrorFlag?: ErrorFlag) => void;
  clear: (customerErrorFlag?: ErrorFlag) => void;
  destroy: (customerErrorFlag?: ErrorFlag) => void;
  __UNSAFE__getQueue: () => (Promise<any>[]) | null
}

export type Callback = (...args: any[]) => void;
export const promiseDeprecatedError: string;

export function gluer<S, D = any, R = any>(fn: HandleFunc<S, D, R>) : GluerReturn<S>;
export function gluer<S, D = any>(initialState: S) : GluerReturn<S>;
export function gluer<S , D = any, R = any>(fn:  HandleFunc<S, D, R>, initialState: S) : GluerReturn<S>;

export function subscribe(deps: GluerReturn<any>[], callback: (...args: any[]) => void, callWhenSub?: boolean): () => void;
export function genRaceQueue(): RaceQueueObj;

export function useModel<T = any, D = any>(model: GluerReturn<T>, service?: Service<T, D>, deps?: any[], options?: ServiceOptions<T>): [T, GluerReturn<T>, ServiceStatus<T, D>];
export function useIndividualModel<S = any, D = any>(initState: S | (() => S), service?: Service<S, D>, deps?: any[], options?: ServiceOptions<S>): [S, GluerReturn<S>, GluerReturn<S>, ServiceStatus<S, D>];
export function useDerivedModel<S = any, P = any>(initState: S | (() => S), source: P, callback: (nextSource: P, prevSource: P, state: S) => S): [S, GluerReturn<S>, GluerReturn<S>, Omit<ServiceStatus<S>, 'service'>];
export function useBatchDerivedModel<S, D extends DerivedSpace<S, any>[]>(initState: S | (() => S), ...derivedSpace: D): [S, GluerReturn<S>, GluerReturn<S>, Omit<ServiceStatus<S>, 'service'>];

export function useLocalService<S>(service: LocalService<S>, options?: IndividualServiceOptions): [LocalService<S>, Omit<ServiceStatus<S>, 'service'>]

export function useDerivedState<S = any>(initState: S | (() => S), callback: (state: S) => S, deps: any[]): [S, GluerReturn<S>, GluerReturn<S>, Omit<ServiceStatus<S>, 'service'>];
export function useDerivedState<S = any>(callback: (state: S) => S, deps: any[]): [S, GluerReturn<S>, GluerReturn<S>, Omit<ServiceStatus<S>, 'service'>];



export function Inject<P extends InjectProps>(WrappedComponent: FC<P>): (count: number) => FC<Omit<P, 'suspenseKeys'>>;

// export function useDerivedStateWithModel<S = any>(mode: GluerReturn<S>, callback: (state: S) => S, deps: any[], callWhenInitial?: boolean): [S];
// export function useBatchDerivedStateToModel<S , D extends DerivedSpace<S, any>[]>(model: GluerReturn<S>, ...derivedSpace: D): [S];
// export function useDerivedStateToModel<P = any, S = any>(source: P, model: GluerReturn<S>, callback: (nextSource: P, prevSource: P, state: S) => S, perf?: boolean): [S];
// export function useSubscribe(deps: GluerReturn<any>[], callback: (...args: any[]) => void, callWhenSub?: boolean): void;
// export function useException(...args: ExceptionJudge[]): ManualException;

