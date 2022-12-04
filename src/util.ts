import {NodePath} from '@babel/traverse';
import {TaggedTemplateExpression, Comment} from '@babel/types';

export const createPlaceholder = (i: number): string => `/*POSTCSS_LIT:${i}*/`;

/**
 * Determines if a given comment is a postcss-lit-disable comment
 * @param {Comment} node Node to test
 * @return {boolean}
 */
export function isDisableComment(node: Comment): boolean {
  return (
    node.type === 'CommentLine' &&
    node.value.includes('postcss-lit-disable-next-line')
  );
}
/**
 * Determines if a node has a leading postcss-lit-disable comment
 * @param {NodePath<TaggedTemplateExpression>} path NodePath to test
 * @return {boolean}
 */
export function hasDisableComment(
  path: NodePath<TaggedTemplateExpression>
): boolean {
  const statement = path.getStatementParent();

  if (statement && statement.node.leadingComments) {
    const comment =
      statement.node.leadingComments[statement.node.leadingComments.length - 1];

    if (comment !== undefined && isDisableComment(comment)) {
      return true;
    }
  }

  return false;
}
