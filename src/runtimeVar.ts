import {promiseDeprecated} from "./constants";
import {ErrorFlag} from "./genRaceQueue";

const runtimeVar: {
  runtimePromiseDeprecatedFlag: ErrorFlag;
} = {
  runtimePromiseDeprecatedFlag: promiseDeprecated,
}

export default runtimeVar;
