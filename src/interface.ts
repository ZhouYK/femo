import {
  depsToCallbackMap,
  globalState,
  model as femoModel,
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

export interface Femo<T> {
  getState: () => { [index: string]: any };
  referToState: (m: any) => any;
  hasModel: (m: any) => boolean;
  subscribe: (...args: [any[], (...p: any[]) => any] | [(...p: any[]) => any]) => any;
  model: T;
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

