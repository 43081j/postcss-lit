import {createParser} from 'postcss-js-core';

export const parse = createParser({
  id: 'lit',
  tagNames: ['css']
});
