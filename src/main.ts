import {parse} from './parse.js';
import {stringify} from './stringify.js';
import {stripStyles} from './stripStyles';
import {RollupPostcssLit} from './rollup';

export = {
  parse,
  stringify,
  RollupPostcssLit,
  tailwindTransform: stripStyles
};
