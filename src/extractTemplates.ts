import {parse} from '@babel/parser';
import {default as traverse, NodePath} from '@babel/traverse';
import {TaggedTemplateExpression} from '@babel/types';

/**
 * Extracts the HTML templates from a given JS source code string.
 * @param {string} content JS source code
 * @return {string}
 */
export function extractTemplates(content: string): string {
  const ast = parse(content, {
    sourceType: 'unambiguous',
    plugins: ['typescript', ['decorators', {decoratorsBeforeExport: true}]],
    ranges: true
  });
  const html: string[] = [];

  traverse(ast, {
    TaggedTemplateExpression: (
      path: NodePath<TaggedTemplateExpression>
    ): void => {
      if (
        path.node.tag.type === 'Identifier' &&
        path.node.tag.name === 'html'
      ) {
        html.push(
          path.node.quasi.quasis.map((quasi) => quasi.value.raw).join('')
        );
      }
    }
  });

  return html.join('\n');
}
