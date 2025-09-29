import {parse} from './parse.js';
import {stringify} from './stringify.js';
import {rollupPostCSSLit} from './rollup.js';
import {stripStyles} from './stripStyles';

export = {
  parse,
  stringify,
  rollupPostCSSLit,
  tailwindTransform: stripStyles
};
