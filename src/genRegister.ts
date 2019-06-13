import {ConnectPlugin, Femo, InnerFemo} from "./interface";
import { registerFlag } from './constants';

const genRegister = (innerFemo: InnerFemo, femo: Femo<any>) => (fn: ConnectPlugin) => {
  innerFemo[registerFlag] = fn(femo);
}

export default genRegister;
