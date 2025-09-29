import stylelint from 'stylelint';
import {assert} from 'chai';
import syntax from '../main.js';

describe('stylelint', () => {
  it('should be lintable by stylelint', async () => {
    const source = `
      css\`
        .foo { width: 100nanoacres; }
      \`;
    `;
    const result = await stylelint.lint({
      customSyntax: syntax,
      code: source,
      codeFilename: 'foo.js',
      config: {
        rules: {
          'unit-no-unknown': true
        }
      }
    });

    assert.equal(result.errored, true);

    const fooResult = result.results[0]!;
    assert.deepEqual(fooResult.warnings, [
      {
        line: 3,
        column: 26,
        endLine: 3,
        endColumn: 35,
        rule: 'unit-no-unknown',
        severity: 'error',
        text: 'Unexpected unknown unit "nanoacres" (unit-no-unknown)',
        // Since strict optional types won't allow this
        fix: undefined as never,
        url: undefined as never
      }
    ]);
  });

  it('should be fixable by stylelint', async () => {
    const source = `
      css\`
        .foo { color: hotpink; color: red; }
      \`;
    `;
    const result = await stylelint.lint({
      customSyntax: syntax,
      code: source,
      codeFilename: 'foo.js',
      fix: true,
      config: {
        rules: {
          'declaration-block-no-duplicate-properties': true
        }
      }
    });

    assert.equal(
      result.code,
      `
      css\`
        .foo { color: red; }
      \`;
    `
    );
  });

  it('should be fixable by stylelint with expressions', async () => {
    const source = `
      css\`
        .foo { color: red; $\{expr}color: hotpink; }
      \`;
    `;
    const result = await stylelint.lint({
      customSyntax: syntax,
      code: source,
      codeFilename: 'foo.js',
      fix: true,
      config: {
        rules: {
          'declaration-block-no-duplicate-properties': true
        }
      }
    });

    assert.equal(
      result.code,
      `
      css\`
        .foo { $\{expr}color: hotpink; }
      \`;
    `
    );
  });

  it('should be fixable by stylelint with multi-line expressions', async () => {
    const source = `
      css\`
        $\{
          expr1
        }
        .foo { color: red; $\{expr2}color: hotpink; }
      \`;
    `;
    const result = await stylelint.lint({
      customSyntax: syntax,
      code: source,
      codeFilename: 'foo.js',
      fix: true,
      config: {
        rules: {
          'declaration-block-no-duplicate-properties': true
        }
      }
    });

    assert.equal(
      result.code,
      `
      css\`
        $\{
          expr1
        }
        .foo { $\{expr2}color: hotpink; }
      \`;
    `
    );
  });
});
