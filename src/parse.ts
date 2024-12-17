import {
  parse as parseCSS,
  Parser,
  Root,
  Document,
  ProcessOptions,
  Input,
  CssSyntaxError
} from 'postcss';
import {parse as babelParse} from '@babel/parser';
import {default as traverse, NodePath} from '@babel/traverse';
import {TaggedTemplateExpression} from '@babel/types';
import {createPlaceholder, hasDisableComment} from './util.js';
import {locationCorrectionWalker} from './locationCorrection.js';
import {getUserConfig} from './userConfig.js';

const configKey = 'postcss-lit';

/**
 * Parses CSS from within tagged template literals in a JavaScript document
 * @param {string} source Source code to parse
 * @param {*=} opts Options to pass to PostCSS' parser when parsing
 * @return {Root|Document}
 */
export const parse: Parser<Root | Document> = (
  source: string | {toString(): string},
  opts?: Pick<ProcessOptions, 'map' | 'from'>
): Root | Document => {
  const doc = new Document();
  const sourceAsString = source.toString();
  const userConfig = getUserConfig(configKey);

  const ast = babelParse(sourceAsString, {
    ...userConfig.babelOptions
  });
  const extractedStyles = new Set<TaggedTemplateExpression>();

  traverse(ast, {
    TaggedTemplateExpression: (
      path: NodePath<TaggedTemplateExpression>
    ): void => {
      if (
        path.node.tag.type === 'Identifier' &&
        path.node.tag.name === 'css' &&
        !hasDisableComment(path)
      ) {
        extractedStyles.add(path.node);
      }
    }
  });

  let currentOffset = 0;

  for (const node of extractedStyles) {
    if (!node.quasi.range) {
      continue;
    }

    const startIndex = node.quasi.range[0] + 1;

    const expressionStrings: string[] = [];
    const placeholders = new Map<number, string>();
    let styleText = '';

    for (let i = 0; i < node.quasi.quasis.length; i++) {
      const template = node.quasi.quasis[i];
      const expr = node.quasi.expressions[i];
      const nextTemplate = node.quasi.quasis[i + 1];

      if (template) {
        styleText += template.value.raw;

        if (expr && nextTemplate && nextTemplate.range && template.range) {
          const exprText = sourceAsString.slice(
            template.range[1],
            nextTemplate.range[0]
          );
          const placeholder = createPlaceholder(
            i,
            styleText,
            nextTemplate?.value.raw
          );
          placeholders.set(i, placeholder);
          styleText += placeholder;
          expressionStrings.push(exprText);
        }
      }
    }

    const baseIndentation = (node.quasi.loc?.end.column ?? 1) - 1;
    const sourceLines = styleText.split('\n');
    const baseIndentations = new Map<number, number>();
    const indentationPattern = new RegExp(`^[ \\t]{${baseIndentation}}`);
    const emptyLinePattern = /^[ \\t\r]*$/;
    const deindentedLines: string[] = [];
    const prefixOffsets = {lines: 0, offset: 0};

    if (
      sourceLines.length > 1 &&
      sourceLines[0] !== undefined &&
      emptyLinePattern.test(sourceLines[0])
    ) {
      prefixOffsets.lines = 1;
      prefixOffsets.offset = sourceLines[0].length + 1;
      sourceLines.shift();
    }

    for (let i = 0; i < sourceLines.length; i++) {
      const sourceLine = sourceLines[i];
      if (sourceLine !== undefined) {
        if (indentationPattern.test(sourceLine)) {
          deindentedLines.push(sourceLine.replace(indentationPattern, ''));
          baseIndentations.set(i + 1, baseIndentation);
          // Roots don't have an end line, so we can't look this up so easily
          // later on. Having a special '-1' key helps here.
          if (i === sourceLines.length - 1) {
            baseIndentations.set(-1, baseIndentation);
          }
        } else {
          deindentedLines.push(sourceLine);
        }
      }
    }

    const deindentedStyleText = deindentedLines
      .join('\n')
      .replace(/\\\\/g, '\\');
    let root: Root;

    try {
      root = parseCSS(deindentedStyleText, {
        ...opts,
        map: false
      }) as Root;
    } catch (err) {
      if (err instanceof CssSyntaxError) {
        const line = node.loc
          ? ` (${opts?.from ?? 'unknown'}:${node.loc.start.line})`
          : opts?.from;

        console.warn(
          '[postcss-lit]',
          `Skipping template${line}` +
            ' as it included either invalid syntax or complex' +
            ' expressions the plugin could not interpret. Consider using a' +
            ' "// postcss-lit-disable-next-line" comment to disable' +
            ' this message'
        );
      }
      // skip this template since it included invalid
      // CSS or overly complex interpolations presumably
      continue;
    }

    root.raws['litPrefixOffsets'] = prefixOffsets;
    root.raws['litTemplateExpressions'] = expressionStrings;
    root.raws['litPlaceholders'] = placeholders;
    root.raws['litBaseIndentations'] = baseIndentations;
    // TODO (43081j): remove this if stylelint/stylelint#5767 ever gets fixed,
    // or they drop the indentation rule. Their indentation rule depends on
    // `beforeStart` existing as they unsafely try to call `endsWith` on it.
    if (!root.raws['beforeStart']) {
      root.raws['beforeStart'] = '';
    }
    root.raws.codeBefore = sourceAsString.slice(
      currentOffset,
      startIndex + prefixOffsets.offset
    );
    root.parent = doc;
    // TODO (43081j): stylelint relies on this existing, really unsure why.
    // it could just access root.parent to get the document...
    (root as Root & {document: Document}).document = doc;
    const walker = locationCorrectionWalker(node);
    walker(root);
    root.walk(walker);
    doc.nodes.push(root);

    currentOffset = node.quasi.range[1] - 1;
  }

  if (doc.nodes.length > 0) {
    const last = doc.nodes[doc.nodes.length - 1];
    if (last) {
      last.raws.codeAfter = sourceAsString.slice(currentOffset);
    }
  }

  doc.source = {
    input: new Input(sourceAsString, opts),
    start: {
      line: 1,
      column: 1,
      offset: 0
    }
  };

  return doc;
};
