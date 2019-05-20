interface Window {
  Proxy: WindowProxy
}

interface FemoAction {
  type: string;
  data: any;
}

interface WrapMap {
  set: (key: any, value: any) => Map<any, any>,
  get: (key: any) => Map<any, any>,
  has: (key: any) => boolean
}

interface ActionCreatorFn<T = any> {
  (p: T): T;
}
interface Reducer {
  (action: FemoAction, state: any): any;
}
