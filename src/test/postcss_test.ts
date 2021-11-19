import {Rule, Declaration, Document, default as postcss} from 'postcss';
import {assert} from 'chai';
import {syntax} from '../main.js';

describe('parse', () => {
  it('should parse basic CSS', async () => {
    const source = `
      css\`
        .foo { color: hotpink; }
      \`;
    `;
    const result = await postcss().process(source, {syntax, from: 'foo.js'});
    const ast = result.root as unknown as Document;
    const root = ast.nodes[0]!;
    const rule = root.nodes[0] as Rule;
    const colour = rule.nodes[0] as Declaration;
    assert.equal(ast.type, 'document');
    assert.equal(root.type, 'root');
    assert.equal(rule.type, 'rule');
    assert.equal(colour.type, 'decl');
    assert.equal(root.raws.codeBefore, '\n      css`');
    assert.equal(root.parent, ast);
    assert.equal(root.raws.codeAfter, '`;\n    ');
    assert.deepEqual(ast.source!.start, {
      line: 1,
      column: 1,
      offset: 0
    });
    assert.equal(ast.source!.input.css, source);
  });
});
