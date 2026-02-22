import {Root, Position, Document, ChildNode} from 'postcss';
import {TaggedTemplateExpression} from '@babel/types';
import {createPlaceholder} from './util.js';

const correctLocation = (
  node: TaggedTemplateExpression,
  loc: Position,
  baseIndentations: Map<number, number>,
  prefixOffsets?: {lines: number; offset: number},
  placeholders?: Map<number, string>
): Position => {
  if (!node.quasi.loc || !node.quasi.range) {
    return loc;
  }

  const baseIndentation = baseIndentations?.get(loc.line) ?? 0;
  const nodeLoc = node.quasi.loc;
  const nodeOffset = node.quasi.range[0];
  let lineOffset = nodeLoc.start.line - 1;
  let newOffset = loc.offset + nodeOffset + 1;
  let currentLine = 1;
  let columnOffset = nodeLoc.start.column + 1;

  if (prefixOffsets) {
    lineOffset += prefixOffsets.lines;
    newOffset += prefixOffsets.offset;
  }

  if (baseIndentations) {
    for (let i = 1; i <= loc.line; i++) {
      newOffset += baseIndentations.get(i) ?? 0;
    }
  }

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
      const placeholder = placeholders?.get(i) ?? createPlaceholder(i);
      const placeholderSize = placeholder.length;
      const exprSize =
        nextQuasi.range[0] - previousQuasi.range[1] - placeholderSize;
      const exprStartLine = previousQuasi.loc.end.line;
      const exprEndLine = nextQuasi.loc.start.line;
      newOffset += exprSize;
      lineOffset += exprEndLine - exprStartLine;

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
  loc.column += baseIndentation;
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
): (node: Document | Root | ChildNode) => void {
  return (node: Document | Root | ChildNode): void => {
    const root = node.root();
    const baseIndentations = root.raws['litBaseIndentations'];

    if (node.source?.start) {
      node.raws['litSourceStartLine'] = node.source.start.line;
      node.source.start = correctLocation(
        expr,
        node.source.start,
        baseIndentations,
        root.raws['litPrefixOffsets'],
        root.raws['litPlaceholders']
      );
    }
    if (node.source?.end) {
      node.raws['litSourceEndLine'] = node.source.end.line;
      node.source.end = correctLocation(
        expr,
        node.source.end,
        baseIndentations,
        root.raws['litPrefixOffsets'],
        root.raws['litPlaceholders']
      );
    }
  };
}
