import {parse} from './parse.js';
import {stringify} from './stringify.js';
import {createTailwindTransform} from 'postcss-js-core';

export = {
  parse,
  stringify,
  tailwindTransform: createTailwindTransform({
    id: 'lit',
    tagNames: ['css']
  })
};
