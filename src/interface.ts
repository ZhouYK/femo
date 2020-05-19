import {
  depsToCallbackMap,
  globalState,
  model as femoModel, promiseDeprecated,
  referencesMap,
  referenceToDepsMap,
} from "./constants";

interface ReactionFn<T = any, R = any>  {
  (data: T): R;
}

export interface Connect<T = any, R = any> {
  (deps: any[], callback: (...args: any[]) => T): (reactionFn: ReactionFn<T, R>) => R;
}

export interface ConnectPlugin {
  (femo: Femo<any>): Connect;
}

export interface ConnectRegister {
  (connectFn: ConnectPlugin): void;
}

export type RaceQueue = (Promise<any> & { [promiseDeprecated]?: boolean })[][];

export interface Femo<T> {
  getState: () => { [index: string]: any };
  referToState: (m: any) => any;
  hasModel: (m: any) => boolean;
  subscribe: (...args: [any[], (...p: any[]) => any] | [(...p: any[]) => any]) => () => void;
  model: T;
  genRaceQueue: () => ({ push: (p: Promise<any>) => void; clear: () => void; destroy: () => void; __UNSAFE__getQueue: () => (Promise<any>[]) | null });
}

type fnc = (...params: any[]) => any;

export interface InnerFemo {
  [globalState]: {
    [index: string]: any;
  },
  [referencesMap]: Map<any, string|symbol> | WrapMap,
  [referenceToDepsMap]: Map<any, any[]>,
  [depsToCallbackMap]: Map<any[], fnc>,
  [femoModel]: { [index: string]: any },
}

export interface Bridge {
    result?: any;
}

