import {assert} from 'chai';
import {createTestAst} from './util.js';
import {syntax} from '../main.js';

describe('stringify', () => {
  it('should stringify basic CSS', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { color: hotpink; }
      \`;
    `);

    const output = ast.toString(syntax);

    assert.equal(output, source);
  });

  it('should stringify single-line expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { $\{expr}color: hotpink; }
      \`;
    `);

    const output = ast.toString(syntax);

    assert.equal(output, source);
  });

  it('should stringify multi-line expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { $\{
          expr
        }color: hotpink; }
      \`;
    `);

    const output = ast.toString(syntax);

    assert.equal(output, source);
  });

  it('should stringify multiple expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { $\{expr}color: hotpink; }
        .bar { $\{expr2}color: lime; }
      \`;
    `);

    const output = ast.toString(syntax);

    assert.equal(output, source);
  });

  it('should stringify multiple same-named expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { $\{expr}color: hotpink; }
        .bar { $\{expr}color: lime; }
      \`;
    `);

    const output = ast.toString(syntax);

    assert.equal(output, source);
  });

  it('should stringify multiple multi-line expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { $\{
          expr }$\{
          expr2
        }color: hotpink; }
      \`;
    `);

    const output = ast.toString(syntax);

    assert.equal(output, source);
  });

  it('should stringify multiple stylesheets', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { color: hotpink; }
      \`;

      const somethingInTheMiddle = 808;

      css\`.foo { color: lime; }\`;
    `);

    const output = ast.toString(syntax);

    assert.equal(output, source);
  });

  it('should handle deleted (by another plugin) expression state', () => {
    const {ast} = createTestAst(`
      css\`
        .foo { $\{expr}color: hotpink; }
      \`;
    `);

    const root = ast.nodes[0]!;
    root.raws['templateExpressions'] = undefined;
    const output = ast.toString(syntax);

    assert.equal(
      output,
      `
      css\`
        .foo { /*POSTCSS_LIT:0*/color: hotpink; }
      \`;
    `
    );
  });
});
