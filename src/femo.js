import { globalState, referencesMap } from './constants'
import { genReferencesMap } from './genProxy'

const femo = {
  [globalState]: {},
  [referencesMap]: genReferencesMap()
};

export default femo;
