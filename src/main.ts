import {Syntax} from 'postcss';
import {parse} from './parse.js';

const syntax: Syntax = {
  parse
};

console.log(
  parse(`
  css\`
    .foo { color: blue; }
  \`;
`).nodes[0]
);

export {syntax};
