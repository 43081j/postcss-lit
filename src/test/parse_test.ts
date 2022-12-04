import {Root, Rule, Declaration, Comment, AtRule} from 'postcss';
import {assert} from 'chai';
import {createTestAst} from './util.js';

describe('parse', () => {
  it('should parse basic CSS', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { color: hotpink; }
      \`;
    `);
    const root = ast.nodes[0] as Root;
    const rule = root.nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(ast.type, 'document');
    assert.equal(root.type, 'root');
    assert.equal(rule.type, 'rule');
    assert.equal(colour.type, 'decl');
    assert.equal(root.raws.codeBefore, '\n      css`\n');
    assert.equal(root.parent, ast);
    assert.equal(root.raws.codeAfter, '`;\n    ');
    assert.deepEqual(ast.source!.start, {
      line: 1,
      column: 1,
      offset: 0
    });
    assert.equal(ast.source!.input.css, source);
  });

  it('should parse modern JS', () => {
    const {ast} = createTestAst(`
      const someObj = {a: {b: 2}};
      const someValue = someObj?.a?.b ?? 3;
      css\`
        .foo { color: hotpink; }
      \`;
    `);
    const root = ast.nodes[0] as Root;
    const rule = root.nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(ast.type, 'document');
    assert.equal(root.type, 'root');
    assert.equal(rule.type, 'rule');
    assert.equal(colour.type, 'decl');
  });

  it('should parse JSX', () => {
    const {ast} = createTestAst(`
      const someObj = {a: {b: 2}};
      const someJsx = (<div>funky</div>);
      css\`
        .foo { color: hotpink; }
      \`;
    `);
    const root = ast.nodes[0] as Root;
    const rule = root.nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(ast.type, 'document');
    assert.equal(root.type, 'root');
    assert.equal(rule.type, 'rule');
    assert.equal(colour.type, 'decl');
  });

  it('should parse typescript', () => {
    const {ast} = createTestAst(`
      function doStuff(x: number, y: number): void {}
      css\`
        .foo { color: hotpink; }
      \`;
    `);
    const root = ast.nodes[0] as Root;
    const rule = root.nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(ast.type, 'document');
    assert.equal(root.type, 'root');
    assert.equal(rule.type, 'rule');
    assert.equal(colour.type, 'decl');
  });

  it('should parse multiple stylesheets', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { color: hotpink; }
      \`;

      css\`.bar: { background: lime; }\`;
    `);
    assert.equal(ast.nodes.length, 2);
    const root1 = ast.nodes[0] as Root;
    const root2 = ast.nodes[1] as Root;

    assert.equal(root1.type, 'root');
    assert.equal(root1.raws.codeBefore, '\n      css`\n');
    assert.equal(root1.raws.codeAfter, undefined);
    assert.equal(root1.parent, ast);
    assert.equal(root2.type, 'root');
    assert.equal(root2.raws.codeBefore, '`;\n\n      css`');
    assert.equal(root2.raws.codeAfter, '`;\n    ');
    assert.equal(root2.parent, ast);

    assert.deepEqual(ast.source!.start, {
      line: 1,
      column: 1,
      offset: 0
    });
    assert.equal(ast.source!.input.css, source);
  });

  it('should parse multi-line stylesheets', async () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo {
          color: hotpink;
        }
      \`;
    `);
    const root = ast.nodes[0] as Root;
    const rule = root.nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(ast.type, 'document');
    assert.equal(root.type, 'root');
    assert.equal(rule.type, 'rule');
    assert.equal(colour.type, 'decl');
    assert.equal(root.raws.codeBefore, '\n      css`\n');
    assert.equal(root.parent, ast);
    assert.equal(root.raws.codeAfter, '`;\n    ');
    assert.deepEqual(ast.source!.start, {
      line: 1,
      column: 1,
      offset: 0
    });
    assert.equal(ast.source!.input.css, source);
  });

  it('should parse multi-line stylesheets containing expressions', async () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo {
          color: hotpink;
          $\{expr}
        }
      \`;
    `);
    const root = ast.nodes[0] as Root;
    const rule = root.nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(ast.type, 'document');
    assert.equal(root.type, 'root');
    assert.equal(rule.type, 'rule');
    assert.equal(colour.type, 'decl');
    assert.equal(root.raws.codeBefore, '\n      css`\n');
    assert.equal(root.parent, ast);
    assert.equal(root.raws.codeAfter, '`;\n    ');
    assert.deepEqual(ast.source!.start, {
      line: 1,
      column: 1,
      offset: 0
    });
    assert.equal(ast.source!.input.css, source);
  });

  it('should parse CSS containing an expression', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { $\{expr}: hotpink; }
      \`;
    `);
    const root = ast.nodes[0] as Root;
    const rule = root.nodes[0] as Rule;
    const expr = rule.nodes[0] as Declaration;
    assert.equal(ast.type, 'document');
    assert.equal(root.type, 'root');
    assert.equal(rule.type, 'rule');
    assert.equal(expr.type, 'decl');
    assert.equal(expr.prop, '--POSTCSS_LIT_0');
    assert.equal(ast.source!.input.css, source);
  });

  it('should parse JS without any CSS', () => {
    const {source, ast} = createTestAst(`
      const foo = 'bar';
    `);
    assert.equal(ast.type, 'document');
    assert.equal(ast.nodes.length, 0);
    assert.deepEqual(ast.source!.start, {
      line: 1,
      column: 1,
      offset: 0
    });
    assert.equal(ast.source!.input.css, source);
  });

  it('should ignore non-css templates', () => {
    const {source, ast} = createTestAst(`
      html\`<div></div>\`;
    `);
    assert.equal(ast.type, 'document');
    assert.equal(ast.nodes.length, 0);
    assert.deepEqual(ast.source!.start, {
      line: 1,
      column: 1,
      offset: 0
    });
    assert.equal(ast.source!.input.css, source);
  });

  it('should parse expression in selector position', () => {
    const {source, ast} = createTestAst(`
      css\`
        $\{expr} {
          color: hotpink;
        }
      \`;
    `);
    assert.equal(ast.source!.input.css, source);
    const root = ast.nodes[0] as Root;

    const rule0 = root.nodes[0] as Rule;
    assert.equal(rule0.type, 'rule');
    assert.equal(rule0.selector, 'POSTCSS_LIT_0');
  });

  it('should parse expression in property position', () => {
    const {source, ast} = createTestAst(`
      css\`
        foo {
          $\{expr}: hotpink;
        }
      \`;
    `);
    assert.equal(ast.source!.input.css, source);
    const root = ast.nodes[0] as Root;

    const rule0 = root.nodes[0] as Rule;
    const rule0Statement0 = rule0.nodes[0] as Declaration;
    assert.equal(rule0Statement0.type, 'decl');
    assert.equal(rule0Statement0.prop, '--POSTCSS_LIT_0');
  });

  it('should parse expression in value position', () => {
    const {source, ast} = createTestAst(`
      css\`
        foo {
          color: $\{expr};
        }
      \`;
    `);
    assert.equal(ast.source!.input.css, source);
    const root = ast.nodes[0] as Root;

    const rule0 = root.nodes[0] as Rule;
    const rule0Statement0 = rule0.nodes[0] as Declaration;
    assert.equal(rule0Statement0.type, 'decl');
    assert.equal(rule0Statement0.prop, 'color');
    assert.equal(rule0Statement0.value, 'POSTCSS_LIT_0');
  });

  it('should parse expression in comment', () => {
    const {source, ast} = createTestAst(`
      css\`
        foo {
          color: hotpink;
        }

        /* a real comment $\{expr} */
      \`;
    `);
    assert.equal(ast.source!.input.css, source);
    const root = ast.nodes[0] as Root;

    const comment = root.nodes[1] as Comment;
    assert.equal(comment.text, 'a real comment POSTCSS_LIT_0');
  });

  it('should parse expression in block position', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo {}

        $\{expr}
      \`;
    `);
    assert.equal(ast.source!.input.css, source);
    const root = ast.nodes[0] as Root;

    const rule0 = root.nodes[1] as Comment;
    assert.equal(rule0.type, 'comment');
    assert.equal(rule0.text, 'POSTCSS_LIT_0');
  });

  it('should parse expression in statement position', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo {
          $\{expr}
        }

        .bar {
          color: hotpink;
          $\{expr}
        }
      \`;
    `);
    assert.equal(ast.source!.input.css, source);
    const root = ast.nodes[0] as Root;

    const rule0 = root.nodes[0] as Rule;
    const comment0 = rule0.nodes[0] as Comment;
    assert.equal(comment0.type, 'comment');
    assert.equal(comment0.text, 'POSTCSS_LIT_0');

    const rule1 = root.nodes[1] as Rule;
    const comment1 = rule1.nodes[1] as Comment;
    assert.equal(comment1.type, 'comment');
    assert.equal(comment1.text, 'POSTCSS_LIT_1');
  });

  it('should parse expression in statement position of at-rule', () => {
    const {source, ast} = createTestAst(`
      css\`
        @foo {
          .foo {
            $\{expr}
          }
        }
      \`;
    `);
    assert.equal(ast.source!.input.css, source);
    const root = ast.nodes[0] as Root;

    const atRule = root.nodes[0] as AtRule;
    const rule = atRule.nodes[0] as Rule;
    const comment = rule.nodes[0] as Comment;
    assert.equal(comment.type, 'comment');
    assert.equal(comment.text, 'POSTCSS_LIT_0');
  });

  it('should parse expression in block position of at-rule', () => {
    const {source, ast} = createTestAst(`
      css\`
        @foo {
          $\{expr}
        }
      \`;
    `);
    assert.equal(ast.source!.input.css, source);
    const root = ast.nodes[0] as Root;

    const atRule = root.nodes[0] as AtRule;
    const comment = atRule.nodes[0] as Comment;
    assert.equal(comment.type, 'comment');
    assert.equal(comment.text, 'POSTCSS_LIT_0');
  });

  it('should ignore disabled lines', () => {
    const {ast} = createTestAst(`
      // postcss-lit-disable-next-line
      css\`
        .foo { color: hotpink; }
      \`;
    `);
    assert.equal(ast.nodes.length, 0);
  });

  it('should ignore deeply disabled lines', () => {
    const {ast} = createTestAst(`
      // postcss-lit-disable-next-line
      someFunction([a, b, css\`
        .foo { color: hotpink; }
      \`]);
    `);
    assert.equal(ast.nodes.length, 0);
  });

  it('should ignore invalid templates', () => {
    const {ast} = createTestAst(`
      css\`
        .foo { /* absolute nonsense */
      \`;
    `);

    assert.equal(ast.nodes.length, 0);
  });
});
