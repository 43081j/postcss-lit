import {
  Stringifier as StringifierFn,
  Comment,
  Root,
  AnyNode,
  Builder
} from 'postcss';
import Stringifier from 'postcss/lib/stringifier';

const placeholderPattern = /^POSTCSS_LIT:\d+$/;

/**
 * Stringifies PostCSS nodes while taking interpolated expressions
 * into account.
 */
class LitStringifier extends Stringifier {
  /** @inheritdoc */
  public override comment(node: Comment): void {
    if (placeholderPattern.test(node.text)) {
      const [, expressionIndexString] = node.text.split(':');
      const expressionIndex = Number(expressionIndexString);
      const root = node.root();
      const expressionStrings = root.raws['litTemplateExpressions'];

      if (expressionStrings && !Number.isNaN(expressionIndex)) {
        const expression = expressionStrings[expressionIndex];

        if (expression) {
          this.builder(expression, node);
          return;
        }
      }
    }

    super.comment(node);
  }

  /** @inheritdoc */
  public override root(node: Root): void {
    this.builder(node.raws.codeBefore ?? '', node, 'start');

    this.body(node);

    // Here we want to recover any previously removed JS indentation
    // if possible. Otherwise, we use the `after` string as-is.
    const after = node.raws['litAfter'] ?? node.raws.after;
    if (after) {
      this.builder(after);
    }

    this.builder(node.raws.codeAfter ?? '', node, 'end');
  }

  /** @inheritdoc */
  public override raw(
    node: AnyNode,
    own: string,
    detect: string | undefined
  ): string {
    if (own === 'before' && node.raws['before'] && node.raws['litBefore']) {
      return node.raws['litBefore'];
    }
    if (own === 'after' && node.raws['after'] && node.raws['litAfter']) {
      return node.raws['litAfter'];
    }
    if (own === 'between' && node.raws['between'] && node.raws['litBetween']) {
      return node.raws['litBetween'];
    }
    return super.raw(node, own, detect);
  }

  /** @inheritdoc */
  public override rawValue(node: AnyNode, prop: string): string {
    const litProp = `lit${prop[0]?.toUpperCase()}${prop.slice(1)}`;
    if (Object.prototype.hasOwnProperty.call(node.raws, litProp)) {
      return `${node.raws[litProp]}`;
    }

    return super.rawValue(node, prop);
  }
}

export const stringify: StringifierFn = (
  node: AnyNode,
  builder: Builder
): void => {
  const str = new LitStringifier(builder);
  str.stringify(node);
};
