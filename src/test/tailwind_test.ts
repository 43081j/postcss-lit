import {assert} from 'chai';
import main = require('../main.js');

const {tailwindTransform} = main;

describe('tailwindTransform', () => {
  it('should strip CSS templates', () => {
    const source = `
      html\`
        <div>Foo</div>
      \`;

      css\`
        .foo { color: blue; }
      \`;
    `;
    const output = tailwindTransform(source);
    const expected = `html\`
        <div>Foo</div>
      \`;`;
    assert.equal(output, expected);
  });

  it('should strip CSS templates containing expressions', () => {
    const source = `
      css\`
        :host { background: cyan; }
      \`;

      css\`.foo { color: yellow; }\`;

      html\`
        <div>$\{foo}</div>
        <p>$\{
          bar
        \}</p>
      \`;
    `;
    const output = tailwindTransform(source);
    const expected = `html\`
        <div>$\{foo}</div>
        <p>$\{bar\}</p>
      \`;`;
    assert.equal(output, expected);
  });
});
