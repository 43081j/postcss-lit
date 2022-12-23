import {createParser} from 'postcss-js-core';

export const parse = createParser({
  stateKey: 'lit',
  tagNames: ['css']
});
