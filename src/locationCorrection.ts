import {Root, Position, Document, ChildNode} from 'postcss';
import {TaggedTemplateExpression} from '@babel/types';
import {createPlaceholder} from './util.js';

const correctLocation = (
  node: TaggedTemplateExpression,
  loc: Position,
  baseIndentations: Map<number, number>,
  prefixOffsets?: {lines: number; offset: number}
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

  let indentationOffset = 0;

  if (baseIndentations) {
    for (let i = 1; i <= loc.line; i++) {
      indentationOffset += baseIndentations.get(i) ?? 0;
    }
  }

  loc.line += lineOffset;
  if (loc.line === currentLine) {
    loc.column += columnOffset;
  }
  loc.column += baseIndentation;

  loc.offset = newOffset + indentationOffset;

  return loc;
};

/**
 * Computes the before/after strings from the original source for
 * restoration later when stringifying.
 * @param {Document|Root|ChildNode} node Node to compute strings for
 * @param {Map} baseIndentations Map of base indentations by line
 * @return {void}
 */
function computeBeforeAfter(
  node: Document | Root | ChildNode,
  baseIndentations: Map<number, number>
): void {
  if (
    node.raws['before'] &&
    (node.raws['before'].includes('\n') || node.parent?.type === 'root') &&
    node.source?.start
  ) {
    const raw = node.raws['before'];
    const line = node.source.start.line;
    const baseIndentation = line && baseIndentations.get(line);
    if (baseIndentation !== undefined) {
      node.raws['litBefore'] = raw + ' '.repeat(baseIndentation);
    }
  }

  if (
    node.type === 'root' &&
    node.raws.after &&
    node.raws.after.includes('\n')
  ) {
    const baseIndentation = baseIndentations.get(-1);

    if (baseIndentation !== undefined) {
      node.raws['litAfter'] = node.raws.after + ' '.repeat(baseIndentation);
    }
  }
}

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

    if (baseIndentations) {
      computeBeforeAfter(node, baseIndentations);
    }

    if (node.source?.start) {
      node.source.start = correctLocation(
        expr,
        node.source.start,
        baseIndentations,
        root.raws['litPrefixOffsets']
      );
    }
    if (node.source?.end) {
      node.source.end = correctLocation(
        expr,
        node.source.end,
        baseIndentations,
        root.raws['litPrefixOffsets']
      );
    }
  };
}
