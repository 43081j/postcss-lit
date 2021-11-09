import {Root, Position, ChildNode} from 'postcss';
import {TaggedTemplateExpression} from '@babel/types';

const correctLocation = (
  expr: TaggedTemplateExpression,
  loc: Position
): Position => {
  if (!expr.quasi.loc || !expr.quasi.range) {
    return loc;
  }

  const exprLoc = expr.quasi.loc;
  const exprOffset = expr.quasi.range[0];

  if (loc.line === 1) {
    loc.column += exprLoc.start.column;
  }

  loc.line += exprLoc.start.line;
  loc.offset += exprOffset;

  return loc;
};

/**
 * Creates an AST walker/visitor for correcting PostCSS AST locations to
 * those in the original JavaScript document.
 * @param {TaggedTemplateExpression} expr Expression the original source came
 * from
 * @return {Function}
 */
export function locationCorrectionWalker(
  expr: TaggedTemplateExpression
): (node: ChildNode | Root) => void {
  return (node: ChildNode | Root): void => {
    if (node.source?.start) {
      node.source.start = correctLocation(expr, node.source.start);
    }
    if (node.source?.end) {
      // TODO (4308j1): this location will still be off if we have
      // expressions, as we have NUM_EXPRESSIONS * PLACEHOLDER_LENGTH of a gap
      // inside the template. Some wizardry needs doing to take that into
      // account as expressions can be cross-line too...
      node.source.end = correctLocation(expr, node.source.end);
    }
  };
}
