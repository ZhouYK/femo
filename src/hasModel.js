import femo from './femo';
import { globalState } from './constants'

export default (model) => femo[globalState].has(model);
