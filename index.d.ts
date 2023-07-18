// gluer
import {FC} from 'react';
import { RuntimeVar } from './src/core/runtimeVar';
import {DerivedSpace} from './src/hooks/rareHooks/useBatchDerivedStateToModel';
import {
  promiseDeprecated,
  promiseDeprecatedFromClonedModel,
  promiseDeprecatedFromLocalService, promiseDeprecatedFromLocalServicePure,
  pureServiceKey
} from './src/core/constants';
import {ErrorFlag} from './src/core/genRaceQueue';


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

export type HandleFunc<S, D, CR> = (state: S, data: D) => CR;

export type GluerReturnFn<S> = {
  (): S;
  <D = undefined, CR = S>(customHandler: HandleFunc<S, D, CR>): CR extends Promise<any> ? Promise<S> : S;
  <D>(data: D): D extends Promise<any> ? Promise<S> : S;
  <D = Partial<S>, CR = S>(data: D, customHandler: HandleFunc<S, D, CR>): CR extends Promise<any> ? Promise<S> : S;
  <D = Partial<S>, CR = S>(data: D, customHandler: HandleFunc<S, D, CR>, mutedCallback: Callback): CR extends Promise<any> ? Promise<S> : S;
}

// index含义：index 为 undefined 表示不是依赖变化引起的 service 执行；
// index 为空数组表示是 hook 第一次执行 service;
// index 里面有数字（这里的数字是对应的当前的deps数组索引），表示是依赖变化引起 service 执行；
// 数字对应的就是变化了的元素的位置（不定长的 deps 先不考虑）
export type Service<T, D = any> = (state: T, data?: D, index?: number[]) => Promise<T> | T;

export type Control<S = any> = FemoModel<ServiceControl<S>>
// Service 与 LocalService 返回保持一致
// LocalService 内部默认会调用 Service
// LocalService 是给外部使用的，所以返回是一个确定的 Promise<S>
export type LocalService<S, D = any> = {
  (data?: D): Promise<S>;
}

export interface LoadingStatus<T = any> {
  loading: boolean;
  successful: boolean; // 用于判断promise是否fullfilled了，true代表fullfilled，false则可能是reject、可能还未开始。
  error?: T;
}

export interface ServiceControl<D = any, E = any> extends LoadingStatus<E> {
  data?: D;
  key?: string; // 用来表明control的用途，消费方可根据此标识来决定是否消费数据及状态
}

export interface ServiceStatus<S, D = any> extends LoadingStatus {
  service:  LocalService<S, D>;
}

export type LocalServiceHasStatus<T> = LocalService<T> & { [pureServiceKey]?: LocalService<T> };


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
  control?: Control<S>; // 外部传入的 model 用于同步状态
  onChange?: (nextState: S, prevState: S) => void; // 节点数据变更时向外通知，一般对组件外使用（组件内的有useDerivedxxx系列）
  onUpdate?: (nextState: S, prevState: S) => void; // 节点数据更新（state 不一定变了）时向外通知，一般对组件外使用
}

export type RaceFn<S> = {
  <D = undefined>(customHandler: HandleFunc<S, D, S>): Promise<S>;
  <D>(data: D): Promise<S>;
  <D = Partial<S>>(data: D, customHandler: HandleFunc<S, D, S>): Promise<S>;
  <D = Partial<S>>(data: D, customHandler: HandleFunc<S, D, S>, mutedCallback: Callback): Promise<S>;
}

export type BindType = 0 | 1; // 0 代表 model 直接绑定的；1 代表通过 useModel 绑定的

export type ListenType = 0 | 1; // 0 代表 数据有变更才执行（除了 onUpdate 之外所有的监听）；1 代表只要进行了更新动作就会执行(具体就是 onUpdate)

export interface Callback {
  (...args: any[]): void;
  __id?: number;
  __bind_type?: BindType;
  __listen_type?: ListenType;
}
export interface UnsubCallback {
  (): void;
  __id?: number;
}

export interface OnCallback<S> {
  (state: S): void;
  // __id?: number;
  // __bind_type?: BindType;
  // __listen_type?: ListenType;
}

export type ModelMethod<S> = {
  reset: () => void;
  watch: <T extends FemoModel<any>[]>(model: T, callback: (data: Copy<T>, state: S ) => S | Promise<S>) => () => void;
  onChange: (callback: OnCallback<S>) => UnsubCallback;
  onUpdate: (callback: OnCallback<S>) => UnsubCallback;
  silent: GluerReturnFn<S>;
  race: RaceFn<S>;
  __race__?: RaceFn<S>;
  preTreat: GluerReturnFn<S>;
};

/**
 *
 * @deprecated 请使用 FemoModel 代替
 */
export type GluerReturn<S> = GluerReturnFn<S> & ModelMethod<S>;

export type FemoModel<S> = GluerReturnFn<S> & ModelMethod<S>;
export interface InjectProps {
  suspenseKeys: string[];
}

export interface IndividualServiceOptions {
  bubble?: boolean;
}
export type RacePromise = Promise<any> & {
  [promiseDeprecated]?: boolean;
  [promiseDeprecatedFromClonedModel]?: boolean;
  [promiseDeprecatedFromLocalService]?: boolean;
  [promiseDeprecatedFromLocalServicePure]?: boolean;
  originId?: number;
};

export interface RaceQueueObj {
  push: <T = any>(p: RacePromise, customerErrorFlag?: ErrorFlag) => void;
  clear: (customerErrorFlag?: ErrorFlag) => void;
  destroy: (customerErrorFlag?: ErrorFlag) => void;
  __UNSAFE__getQueue: () => (Promise<any>[]) | null
}

export const promiseDeprecatedError: string;

export function gluer<S, D = any, R = any>(fn: HandleFunc<S, D, R>) : FemoModel<S>;
export function gluer<S, D = any>(initialState: S) : FemoModel<S>;
export function gluer<S , D = any, R = any>(fn:  HandleFunc<S, D, R>, initialState: S) : FemoModel<S>;

export function subscribe(deps: FemoModel<any>[], callback: (...args: any[]) => void, callWhenSub?: boolean): UnsubCallback;
export function unsubscribe(targetDeps?: FemoModel<any>[], callback?: Callback | Callback[]): void;

export function genRaceQueue(): RaceQueueObj;

export function genRegister<M>(): {
  register: <K extends keyof M>(key: K, model: M[K]) => void;
  unregister: <K extends keyof M>(key: K, model?: M[K]) => void;
  pick: <K extends keyof M>(key: K) => M[K];
  useRegister: <K extends keyof M>(key: K, model: M[K]) => void;
  usePick: <K extends keyof M>(key: K) => M[K];
}

export function useModel<S = any, D = any>(initState: FemoModel<S> | S | (() => S), service?: Service<S, D>, deps?: any[], options?: ServiceOptions<S>): [S, FemoModel<S>, FemoModel<S>, ServiceStatus<S, D>];

/**
 * @deprecated 请使用 useModel 代替
 */
export function useIndividualModel<S = any, D = any>(initState: S | (() => S), service?: Service<S, D>, deps?: any[], options?: ServiceOptions<S>): [S, FemoModel<S>, FemoModel<S>, ServiceStatus<S, D>];
export function useDerivedModel<S = any, P = any>(initState: S | (() => S), source: P, callback: (nextSource: P, prevSource: P, state: S) => S): [S, FemoModel<S>, FemoModel<S>, LoadingStatus];
export function useBatchDerivedModel<S, D extends DerivedSpace<S>[]>(initState: S | (() => S), ...derivedSpace: D): [S, FemoModel<S>, FemoModel<S>, LoadingStatus];

export function useLocalService<S, D>(service: LocalService<S, D>, options?: IndividualServiceOptions): [LocalService<S, D>, LoadingStatus]

export function useDerivedState<S = any>(initState: S | (() => S), callback: (state: S) => S, deps: any[]): [S, FemoModel<S>, FemoModel<S>, LoadingStatus];
export function useDerivedState<S = any>(callback: (state: S) => S, deps: any[]): [S, FemoModel<S>, FemoModel<S>, LoadingStatus];

export function useLight(callback: () => any, deps: any[]): void;


export function Inject<P extends InjectProps>(WrappedComponent: FC<P>): (count: number) => FC<Omit<P, 'suspenseKeys'>>;

export function useDerivedStateWithModel<S = any>(mode: FemoModel<S>, callback: (state: S) => S, deps: any[], callWhenInitial?: boolean): [S];

// export function useBatchDerivedStateToModel<S , D extends DerivedSpace<S>[]>(model: FemoModel<S>, ...derivedSpace: D): [S];
// export function useDerivedStateToModel<P = any, S = any>(source: P, model: FemoModel<S>, callback: (nextSource: P, prevSource: P, state: S) => S, perf?: boolean): [S];
// export function useSubscribe(deps: FemoModel<any>[], callback: (...args: any[]) => void, callWhenSub?: boolean): void;
// export function useException(...args: ExceptionJudge[]): ManualException;

export const runtimeVar: RuntimeVar
