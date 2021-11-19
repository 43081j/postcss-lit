import {Syntax} from 'postcss';
import {parse} from './parse.js';
import {stringify} from './stringify.js';

const syntax: Syntax = {
  parse,
  stringify
};

export {syntax};
