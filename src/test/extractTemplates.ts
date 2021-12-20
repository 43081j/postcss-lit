import {assert} from 'chai';
import {extractTemplates} from '../extractTemplates.js';

describe('extractTemplates', () => {
  it('should extract HTML from templates', () => {
    const source = `
      html\`
        <div>Foo</div>
      \`;
    `;
    const output = extractTemplates(source);
    const expected = `
        <div>Foo</div>
      `;
    assert.equal(output, expected);
  });

  it('should extract HTML from templates with expressions', () => {
    const source = `
      html\`
        <div>$\{foo}</div>
        <p>$\{
          bar
        \}</p>
      \`;
    `;
    const output = extractTemplates(source);
    const expected = `
        <div></div>
        <p></p>
      `;
    assert.equal(output, expected);
  });
});
