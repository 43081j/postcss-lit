import {Parser, Root, Document, ProcessOptions, Input} from 'postcss';
import postcssParse from 'postcss/lib/parse';
import {parse as babelParse} from '@babel/parser';
import {default as traverse, NodePath} from '@babel/traverse';
import {TaggedTemplateExpression} from '@babel/types';
import {createPlaceholder} from './util.js';
import {locationCorrectionWalker} from './locationCorrection.js';

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
  const ast = babelParse(sourceAsString, {
    sourceType: 'unambiguous',
    plugins: ['typescript'],
    ranges: true
  });
  const extractedStyles = new Set<TaggedTemplateExpression>();

  traverse(ast, {
    TaggedTemplateExpression: (
      path: NodePath<TaggedTemplateExpression>
    ): void => {
      if (path.node.tag.type === 'Identifier' && path.node.tag.name === 'css') {
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
          styleText += createPlaceholder(i);
          expressionStrings.push(exprText);
        }
      }
    }

    const root = postcssParse(styleText, {
      ...opts,
      map: false
    });

    root.raws['templateExpressions'] = expressionStrings;
    root.raws.codeBefore = sourceAsString.slice(currentOffset, startIndex);
    root.parent = doc;
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
