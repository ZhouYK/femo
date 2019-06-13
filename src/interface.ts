import {
  depsToCallbackMap,
  globalState,
  model as femoModel,
  referencesMap,
  referenceToDepsMap,
  registerFlag
} from "./constants";

interface PlainObject {
  [index: string]: any;
}

export interface Connect {
  (deps: any[], callback: (...args: any[]) => PlainObject): (consumer: any) => any;
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
  registerConnect: ConnectRegister;
  connect: Connect;
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
  [registerFlag]: Connect;
}

