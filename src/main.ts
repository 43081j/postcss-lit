import {parse} from './parse.js';
import {stringify} from './stringify.js';
import {extractTemplates} from './extractTemplates';

export = {
  parse,
  stringify,
  tailwindTransform: extractTemplates
};
