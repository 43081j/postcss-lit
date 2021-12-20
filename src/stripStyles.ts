import {parse} from '@babel/parser';
import {default as traverse, NodePath} from '@babel/traverse';
import {TaggedTemplateExpression} from '@babel/types';
import {default as generate} from '@babel/generator';

/**
 * Extracts the HTML templates from a given JS source code string.
 * @param {string} content JS source code
 * @return {string}
 */
export function stripStyles(content: string): string {
  const ast = parse(content, {
    sourceType: 'unambiguous',
    plugins: ['typescript', ['decorators', {decoratorsBeforeExport: true}]],
    ranges: true
  });

  traverse(ast, {
    TaggedTemplateExpression: (
      path: NodePath<TaggedTemplateExpression>
    ): void => {
      if (path.node.tag.type === 'Identifier' && path.node.tag.name === 'css') {
        path.remove();
      }
    }
  });

  const {code} = generate(ast);

  return code;
}
