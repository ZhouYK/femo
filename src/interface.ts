import {
  promiseDeprecated,
} from "./constants";

export type RaceQueue = (Promise<any> & { [promiseDeprecated]?: boolean })[][];

