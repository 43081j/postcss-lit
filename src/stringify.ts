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
      const expressionStrings = root.raws['templateExpressions'];

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
    super.root(node);
    this.builder(node.raws.codeAfter ?? '', node, 'end');
  }
}

export const stringify: StringifierFn = (
  node: AnyNode,
  builder: Builder
): void => {
  const str = new LitStringifier(builder);
  str.stringify(node);
};
