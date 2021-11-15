import {Document, Root, Rule, Declaration, Node} from 'postcss';
import {assert} from 'chai';
import {parse} from '../parse.js';

const createTestAst = (source: string): {ast: Document; source: string} => {
  const ast = parse(source) as Document;

  return {ast, source};
};

const getSourceForLoc = (source: string, node: Node): string => {
  const loc = node.source;

  if (!loc || !loc.start || !loc.end) {
    return '';
  }

  const lines = source.split(/\r\n|\n/);
  const result: string[] = [];
  const startLineIndex = loc.start.line - 1;
  const endLineIndex = loc.end.line - 1;

  for (let i = startLineIndex; i < loc.end.line; i++) {
    const line = lines[i];
    if (line) {
      let offsetStart = 0;
      let offsetEnd = line.length;

      if (i === startLineIndex) {
        offsetStart = loc.start.column - 1;
      }

      if (i === endLineIndex) {
        offsetEnd = loc.end.column;
      }

      result.push(line.substring(offsetStart, offsetEnd));
    }
  }

  return result.join('\n');
};

const getSourceForRange = (source: string, node: Node): string => {
  if (!node.source || !node.source.start || !node.source.end) {
    return '';
  }

  return source.substring(node.source.start.offset, node.source.end.offset + 1);
};

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
    assert.equal(getSourceForLoc(source, rule), '.foo { color: hotpink; }');
    assert.equal(getSourceForLoc(source, colour), 'color: hotpink;');
    assert.equal(getSourceForRange(source, rule), '.foo { color: hotpink; }');
    assert.equal(getSourceForRange(source, colour), 'color: hotpink;');
  });

  it('should account for single-line expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { $\{expr\}color: hotpink; }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const colour = rule.nodes[1] as Declaration;
    assert.equal(colour.type, 'decl');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForLoc(source, rule),
      '.foo { ${expr}color: hotpink; }'
    );
    assert.equal(getSourceForLoc(source, colour), 'color: hotpink;');
    assert.equal(
      getSourceForRange(source, rule),
      '.foo { ${expr}color: hotpink; }'
    );
    assert.equal(getSourceForRange(source, colour), 'color: hotpink;');
  });

  it('should account for multiple single-line expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { $\{expr\}color: $\{expr2\}hotpink; }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const colour = rule.nodes[1] as Declaration;
    assert.equal(colour.type, 'decl');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForLoc(source, rule),
      '.foo { ${expr}color: ${expr2}hotpink; }'
    );
    assert.equal(getSourceForLoc(source, colour), 'color: ${expr2}hotpink;');
    assert.equal(
      getSourceForRange(source, rule),
      '.foo { ${expr}color: ${expr2}hotpink; }'
    );
    assert.equal(getSourceForRange(source, colour), 'color: ${expr2}hotpink;');
  });

  it('should account for multi-line expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { $\{
          expr
        \}color: hotpink; }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const colour = rule.nodes[1] as Declaration;
    assert.equal(colour.type, 'decl');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForLoc(source, rule),
      `.foo { $\{
          expr
        }color: hotpink; }`
    );
    assert.equal(getSourceForLoc(source, colour), 'color: hotpink;');
    assert.equal(
      getSourceForRange(source, rule),
      `.foo { $\{
          expr
        }color: hotpink; }`
    );
    assert.equal(getSourceForRange(source, colour), 'color: hotpink;');
  });

  it('should account for multiple mixed-size expressions', () => {
    const {source, ast} = createTestAst(`
      css\`
        .foo { $\{
          expr
        \} $\{expr2\}color: hotpink; }
      \`;
    `);
    const rule = (ast.nodes[0] as Root).nodes[0] as Rule;
    const colour = rule.nodes[2] as Declaration;
    assert.equal(colour.type, 'decl');
    assert.equal(rule.type, 'rule');
    assert.equal(
      getSourceForLoc(source, rule),
      `.foo { $\{
          expr
        } $\{expr2}color: hotpink; }`
    );
    assert.equal(getSourceForLoc(source, colour), 'color: hotpink;');
    assert.equal(
      getSourceForRange(source, rule),
      `.foo { $\{
          expr
        } $\{expr2}color: hotpink; }`
    );
    assert.equal(getSourceForRange(source, colour), 'color: hotpink;');
  });
});
