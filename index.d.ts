// gluer
export type HandleFunc<S, D = S> = (data: D, state: S) => S;

type fnc<D> = (data?: D) => D;
export type GluerReturn<S, D = S>  = S & {
  readonly [P in keyof S]: S[P];
} & fnc<D> & {
  actionType: string
};


export interface Femo<T> {
  getState: () => { [index: string]: any },
  referToState: (m: any) => any,
  hasModel: (m: any) => boolean,
  subscribe: (...args: [any[], (...p: any[]) => any] | [(...p: any[]) => any]) => any,
  model: T,
  [index: string]: any;
}

export function gluer<S, D = S>(onlyOne: HandleFunc<S, D> | S) : GluerReturn<S, D>;
export function gluer<S, D = S>(fn: HandleFunc<S, D>, initialState: S) : GluerReturn<S, D>;

export default function femo<T>(structure: T): Femo<T>;
