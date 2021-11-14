import {Root, Position, ChildNode} from 'postcss';
import {TaggedTemplateExpression} from '@babel/types';

const correctLocation = (
  node: TaggedTemplateExpression,
  loc: Position
): Position => {
  if (!node.quasi.loc || !node.quasi.range) {
    return loc;
  }

  const nodeLoc = node.quasi.loc;
  const nodeOffset = node.quasi.range[0];
  const newOffset = loc.offset + nodeOffset;
  let newColumn = loc.line === 1 ? nodeLoc.start.column : loc.column;
  let lineOffset = nodeLoc.start.line - 1;

  for (const expr of node.quasi.expressions) {
    if (expr.loc && expr.range && expr.range[0] < newOffset) {
      lineOffset += expr.loc.end.line - expr.loc.start.line;
      newColumn = expr.loc.end.column + 2;
    }
  }

  loc.column = newColumn;
  loc.line += lineOffset;
  loc.offset = newOffset;

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
      node.source.end = correctLocation(expr, node.source.end);
    }
  };
}
