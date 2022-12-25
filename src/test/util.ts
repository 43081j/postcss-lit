import {Document} from 'postcss';
import {parse} from '../parse.js';

export function createTestAst(source: string): {ast: Document; source: string} {
  const ast = parse(source) as Document;

  return {ast, source};
}
