import {Root, Rule, Declaration, Comment, AtRule} from 'postcss';
import {assert} from 'chai';
import {
  createTestAst,
  getSourceForNodeByRange,
  getSourceForNodeByLoc
} from './util.js';

describe('locationCorrection', () => {
  it('should translate basic CSS positions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { color: hotpink; }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(colour.type, 'decl');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      '.foo { color: hotpink; }'
    );
    assert.equal(getSourceForNodeByLoc(source, colour), 'color: hotpink;');
    assert.equal(
      getSourceForNodeByRange(source, rule),
      '.foo { color: hotpink; }'
    );
    assert.equal(getSourceForNodeByRange(source, colour), 'color: hotpink;');
  });

  it('should handle multi-line CSS', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo {
          color: hotpink;
        }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(colour.type, 'decl');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      `.foo {
          color: hotpink;
        }`
    );
    assert.equal(getSourceForNodeByLoc(source, colour), 'color: hotpink;');
    assert.equal(
      getSourceForNodeByRange(source, rule),
      `.foo {
          color: hotpink;
        }`
    );
    assert.equal(getSourceForNodeByRange(source, colour), 'color: hotpink;');
  });

  it('should handle multi-line CSS with expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo {
          color: hotpink;
          $\{expr}
        }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(colour.type, 'decl');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      `.foo {
          color: hotpink;
          $\{expr}
        }`
    );
    assert.equal(getSourceForNodeByLoc(source, colour), 'color: hotpink;');
    assert.equal(
      getSourceForNodeByRange(source, rule),
      `.foo {
          color: hotpink;
          $\{expr}
        }`
    );
    assert.equal(getSourceForNodeByRange(source, colour), 'color: hotpink;');
  });

  it('should handle single line css', () => {
    const {source, ast} = createTestAst(`css\`.foo { color: hotpink; }\`;`);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(colour.type, 'decl');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      '.foo { color: hotpink; }'
    );
    assert.equal(getSourceForNodeByLoc(source, colour), 'color: hotpink;');
    assert.equal(
      getSourceForNodeByRange(source, rule),
      '.foo { color: hotpink; }'
    );
    assert.equal(getSourceForNodeByRange(source, colour), 'color: hotpink;');
  });

  it('should account for single-line expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { $\{expr\}: hotpink; }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const expr = rule.nodes[0] as Declaration;
    assert.equal(expr.type, 'decl');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      '.foo { ${expr}: hotpink; }'
    );
    assert.equal(getSourceForNodeByLoc(source, expr), '${expr}: hotpink;');
    assert.equal(
      getSourceForNodeByRange(source, rule),
      '.foo { ${expr}: hotpink; }'
    );
    assert.equal(getSourceForNodeByRange(source, expr), '${expr}: hotpink;');
  });

  it('should account for expressions in value positions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { color: $\{expr\}; }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(colour.type, 'decl');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      '.foo { color: ${expr}; }'
    );
    assert.equal(getSourceForNodeByLoc(source, colour), 'color: ${expr};');
    assert.equal(
      getSourceForNodeByRange(source, rule),
      '.foo { color: ${expr}; }'
    );
    assert.equal(getSourceForNodeByRange(source, colour), 'color: ${expr};');
  });

  it('should account for multiple single-line expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { $\{expr\}: $\{expr2\}; }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(colour.type, 'decl');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      '.foo { ${expr}: ${expr2}; }'
    );
    assert.equal(getSourceForNodeByLoc(source, colour), '${expr}: ${expr2};');
    assert.equal(
      getSourceForNodeByRange(source, rule),
      '.foo { ${expr}: ${expr2}; }'
    );
    assert.equal(getSourceForNodeByRange(source, colour), '${expr}: ${expr2};');
  });

  it('should account for multi-line expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { $\{
          expr
        \}: hotpink; }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(colour.type, 'decl');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      `.foo { $\{
          expr
        }: hotpink; }`
    );
    assert.equal(
      getSourceForNodeByLoc(source, colour),
      `$\{
          expr
        }: hotpink;`
    );
    assert.equal(
      getSourceForNodeByRange(source, rule),
      `.foo { $\{
          expr
        }: hotpink; }`
    );
    assert.equal(
      getSourceForNodeByRange(source, colour),
      `$\{
          expr
        }: hotpink;`
    );
  });

  it('should account for multiple mixed-size expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo {
          $\{
            expr
          \}
          $\{expr2\}
        }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const expr0 = rule.nodes[0] as Comment;
    const expr1 = rule.nodes[1] as Comment;
    assert.equal(expr0.type, 'comment');
    assert.equal(expr1.type, 'comment');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      `.foo {
          $\{
            expr
          }
          $\{expr2}
        }`
    );
    assert.equal(
      getSourceForNodeByLoc(source, expr0),
      `$\{
            expr
          }`
    );
    assert.equal(getSourceForNodeByLoc(source, expr1), '${expr2}');
    assert.equal(
      getSourceForNodeByRange(source, rule),
      `.foo {
          $\{
            expr
          }
          $\{expr2}
        }`
    );
    assert.equal(
      getSourceForNodeByRange(source, expr0),
      `$\{
            expr
          }`
    );
    assert.equal(getSourceForNodeByRange(source, expr1), '${expr2}');
  });

  it('should account for expressions as properties', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo {
          color: $\{expr\}
        }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const statement = rule.nodes[0] as Declaration;
    assert.equal(statement.type, 'decl');
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      `.foo {
          color: $\{expr}
        }`
    );
    assert.equal(getSourceForNodeByLoc(source, statement), `color: $\{expr}`);
    assert.equal(
      getSourceForNodeByRange(source, rule),
      `.foo {
          color: $\{expr}
        }`
    );
    assert.equal(getSourceForNodeByRange(source, statement), `color: $\{expr}`);
  });

  it('should account for expressions as statements', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo {
          $\{expr\}
        }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const comment = rule.nodes[0] as Comment;
    assert.equal(comment.type, 'comment');
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      `.foo {
          $\{expr}
        }`
    );
    assert.equal(getSourceForNodeByLoc(source, comment), `$\{expr}`);
    assert.equal(
      getSourceForNodeByRange(source, rule),
      `.foo {
          $\{expr}
        }`
    );
    assert.equal(getSourceForNodeByRange(source, comment), `$\{expr}`);
  });

  it('should account for expressions as values', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo {
          $\{expr\}: hotpink;
        }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const statement = rule.nodes[0] as Declaration;
    assert.equal(statement.type, 'decl');
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      `.foo {
          $\{expr}: hotpink;
        }`
    );
    assert.equal(
      getSourceForNodeByLoc(source, statement),
      `$\{expr}: hotpink;`
    );
    assert.equal(
      getSourceForNodeByRange(source, rule),
      `.foo {
          $\{expr}: hotpink;
        }`
    );
    assert.equal(
      getSourceForNodeByRange(source, statement),
      `$\{expr}: hotpink;`
    );
  });

  it('should account for expressions as selectors', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo {
          color: hotpink;
        }
        $\{expr} {
          color: hotpink;
        }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[1] as Rule;
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      `$\{expr} {
          color: hotpink;
        }`
    );
    assert.equal(
      getSourceForNodeByRange(source, rule),
      `$\{expr} {
          color: hotpink;
        }`
    );
  });

  it('should account for code before', () => {
    const {source, ast} = createTestAst(`
      const foo = bar + baz;
      css\`
        .foo { color: hotpink; }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(colour.type, 'decl');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      '.foo { color: hotpink; }'
    );
    assert.equal(getSourceForNodeByLoc(source, colour), 'color: hotpink;');
    assert.equal(
      getSourceForNodeByRange(source, rule),
      '.foo { color: hotpink; }'
    );
    assert.equal(getSourceForNodeByRange(source, colour), 'color: hotpink;');
  });

  it('should account for mixed indentation', () => {
    const {source, ast} = createTestAst(`
      css\`
  .foo { $\{expr\}: hotpink; }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(colour.type, 'decl');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      '.foo { ${expr}: hotpink; }'
    );
    assert.equal(getSourceForNodeByLoc(source, colour), '${expr}: hotpink;');
    assert.equal(
      getSourceForNodeByRange(source, rule),
      '.foo { ${expr}: hotpink; }'
    );
    assert.equal(getSourceForNodeByRange(source, colour), '${expr}: hotpink;');
  });

  it('should account for indentation in at-rule params', () => {
    const {source, ast} = createTestAst(`
      css\`
        @foo xyz and (
          bananas: 808px
        ) {
        }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as AtRule;
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      `@foo xyz and (
          bananas: 808px
        ) {
        }`
    );
    assert.equal(
      getSourceForNodeByRange(source, rule),
      `@foo xyz and (
          bananas: 808px
        ) {
        }`
    );
  });

  it('should account for indentation in declaration values', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo {
          border-radius:
            4px
            4xp;
        }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    assert.equal(
      getSourceForNodeByLoc(source, rule),
      `.foo {
          border-radius:
            4px
            4xp;
        }`
    );
    assert.equal(
      getSourceForNodeByRange(source, rule),
      `.foo {
          border-radius:
            4px
            4xp;
        }`
    );
  });
});
