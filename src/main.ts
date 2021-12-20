import {parse} from './parse.js';
import {stringify} from './stringify.js';
import {stripStyles} from './stripStyles';

export = {
  parse,
  stringify,
  tailwindTransform: stripStyles
};
