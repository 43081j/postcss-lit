import {Syntax, Parser, Root, Document, ProcessOptions, Input} from 'postcss';
import postcssParse from 'postcss/lib/parse';
import {parse as babelParse} from '@babel/parser';
import {default as traverse, NodePath} from '@babel/traverse';
import {TaggedTemplateExpression} from '@babel/types';

const parse: Parser<Root | Document> = (
  source: string | {toString(): string},
  opts?: Pick<ProcessOptions, 'map' | 'from'>
): Root | Document => {
  const doc = new Document();
  const ast = babelParse(source.toString(), {
    sourceType: 'unambiguous'
  });
  const extractedStyles = new Set<string>();

  traverse(ast, {
    TaggedTemplateExpression: (
      path: NodePath<TaggedTemplateExpression>
    ): void => {
      if (path.node.tag.type === 'Identifier' && path.node.tag.name === 'css') {
        const value = path.node.quasi.quasis
          .map((template) => template.value.raw)
          .join('/* PLACEHOLDER */');

        extractedStyles.add(value);
      }
    }
  });

  for (const styleText of extractedStyles) {
    const root = postcssParse(styleText, {
      ...opts,
      map: false
    });

    root.parent = doc;
    doc.nodes.push(root);
  }

  doc.source = {
    input: new Input(source.toString(), opts),
    start: {
      line: 1,
      column: 1,
      offset: 0
    }
  };

  return doc;
};

const syntax: Syntax = {
  parse
};

console.log(
  (
    parse(`
  css\`
    .foo { color: blue; }
  \`;
`).nodes[0] as Root
  ).nodes[0]
);

export {syntax};
