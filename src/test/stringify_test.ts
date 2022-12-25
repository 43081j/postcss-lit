import {assert} from 'chai';
import {createTestAst} from './util.js';
import syntax = require('../main.js');

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

  it('should stringify CSS with expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { color: $\{expr}; }

        .foo {
          $\{expr}: red;
          color: $\{expr};
        }

        $\{expr} {
          color: hotpink;
        }
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

  it('should stringify non-css JS', () => {
    const {source, ast} = createTestAst(`
      const a = 5;
      const b = 303;
    `);

    const output = ast.toString(syntax);

    assert.equal(output, source);
  });

  it('should stringify empty CSS', () => {
    const {source, ast} = createTestAst(`
      css\`\`;
    `);

    const output = ast.toString(syntax);

    assert.equal(output, source);
  });

  it('should stringify single-line CSS', () => {
    const {source, ast} = createTestAst(`
      css\`.foo { color: hotpink; }\`;
    `);

    const output = ast.toString(syntax);

    assert.equal(output, source);
  });
});
