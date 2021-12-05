import {Root, Position, Document, ChildNode} from 'postcss';
import {TaggedTemplateExpression} from '@babel/types';
import {createPlaceholder} from './util.js';

const correctLocation = (
  node: TaggedTemplateExpression,
  loc: Position,
  baseIndentation: number
): Position => {
  if (!node.quasi.loc || !node.quasi.range) {
    return loc;
  }

  const nodeLoc = node.quasi.loc;
  const nodeOffset = node.quasi.range[0];
  let lineOffset = nodeLoc.start.line - 1;
  let newOffset = loc.offset + nodeOffset + 1;
  let currentLine = 1;
  let columnOffset = nodeLoc.start.column + 1;
  let expressionLines = 0;

  for (let i = 0; i < node.quasi.expressions.length; i++) {
    const expr = node.quasi.expressions[i];
    const previousQuasi = node.quasi.quasis[i];
    const nextQuasi = node.quasi.quasis[i + 1];

    if (
      expr &&
      expr.loc &&
      expr.range &&
      nextQuasi &&
      previousQuasi &&
      previousQuasi.loc &&
      nextQuasi.loc &&
      previousQuasi.range &&
      nextQuasi.range &&
      previousQuasi.range[1] < newOffset
    ) {
      const placeholderSize = createPlaceholder(i).length;
      const exprSize =
        nextQuasi.range[0] - previousQuasi.range[1] - placeholderSize;
      const exprStartLine = previousQuasi.loc.end.line;
      const exprEndLine = nextQuasi.loc.start.line;
      newOffset += exprSize;
      lineOffset += exprEndLine - exprStartLine;
      expressionLines += nextQuasi.loc.start.line - previousQuasi.loc.end.line;

      if (currentLine !== exprEndLine) {
        currentLine = exprEndLine;
        if (exprStartLine === exprEndLine) {
          columnOffset = exprSize;
        } else {
          columnOffset =
            nextQuasi.loc.start.column -
            previousQuasi.loc.end.column -
            placeholderSize;
        }
      } else {
        columnOffset += exprSize;
      }
    }
  }

  loc.line += lineOffset;
  if (loc.line === currentLine) {
    loc.column += columnOffset;
  }
  if (loc.line !== 1) {
    loc.column += baseIndentation;
  }
  loc.offset =
    newOffset +
    (loc.line - nodeLoc.start.line - expressionLines) * baseIndentation;

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
): (node: Document | Root | ChildNode) => void {
  return (node: Document | Root | ChildNode): void => {
    const root = node.root();
    const baseIndentation = root.raws['baseIndentation'] ?? 0;
    if (node.source?.start) {
      node.source.start = correctLocation(
        expr,
        node.source.start,
        baseIndentation
      );
    }
    if (node.source?.end) {
      node.source.end = correctLocation(expr, node.source.end, baseIndentation);
    }
  };
}
