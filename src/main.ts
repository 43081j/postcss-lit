import {parse} from './parse.js';
import {stringify} from './stringify.js';
import {RollupPostcssLit} from './rollup.js';
import {stripStyles} from './stripStyles';

export = {
  parse,
  stringify,
  RollupPostcssLit,
  tailwindTransform: stripStyles
};
