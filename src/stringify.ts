import {
  Stringifier as StringifierFn,
  Root,
  Document,
  AnyNode,
  Builder,
  Comment
} from 'postcss';
import Stringifier from 'postcss/lib/stringifier';
import {
  defaultPlaceholder,
  placeholderMapping,
  Position,
  computeCorrectedString
} from './util.js';

/**
 * Stringifies PostCSS nodes while taking interpolated expressions
 * into account.
 */
class LitStringifier extends Stringifier {
  /** @inheritdoc */
  public constructor(builder: Builder) {
    const wrappedBuilder: Builder = (
      str: string,
      node?: AnyNode,
      type?: 'start' | 'end'
    ): void => {
      // We purposely ignore the root node since the only thing we should
      // be stringifying here is already JS (before/after raws) so likely
      // already contains backticks on purpose.
      //
      // Similarly, if there is no node, we're probably stringifying
      // pure JS which never contained any CSS. Or something really weird
      // we don't want to touch anyway.
      //
      // For everything else, we want to escape backticks.
      if (!node || node?.type === 'root') {
        builder(str, node, type);
      } else {
        let processedString = str.replace(/\\/g, '\\\\').replace(/`/g, '\\`');

        const mappingKeys = [...Object.keys(placeholderMapping), 'default'];

        for (const key of mappingKeys) {
          const mapping =
            key === 'default'
              ? defaultPlaceholder
              : placeholderMapping[key as Position];

          if (mapping) {
            processedString = processedString.replace(
              mapping.regex,
              (placeholder, i) =>
                this._replacePlaceholders(placeholder, node, Number(i))
            );
          }
        }

        builder(processedString, node, type);
      }
    };
    super(wrappedBuilder);
  }

  /**
   * Replaces a placeholder with the original expression it represents
   * @param {string} placeholder Original placeholder string
   * @param {AnyNode} node Node which contains the placeholder
   * @param {number} expressionIndex Index of the expression this is a
   * placeholder for
   * @return {string}
   */
  protected _replacePlaceholders(
    placeholder: string,
    node: AnyNode,
    expressionIndex: number
  ): string {
    const root = node.root();
    const expressionStrings = root.raws['litTemplateExpressions'];

    if (expressionStrings && !Number.isNaN(expressionIndex)) {
      const expression = expressionStrings[expressionIndex];

      if (expression) {
        return expression;
      }
    }

    return placeholder;
  }

  /** @inheritdoc */
  public override document(node: Document): void {
    if (node.nodes.length === 0) {
      this.builder(node.source?.input.css ?? '');
    } else {
      super.document(node);
    }
  }

  /** @inheritdoc */
  public override root(node: Root): void {
    this.builder(node.raws.codeBefore ?? '', node, 'start');

    this.body(node);

    const after = node.raws.after;
    if (after) {
      const baseIndentations = node.raws['litBaseIndentations'] as
        | Map<number, number>
        | undefined;
      if (baseIndentations && after.includes('\n')) {
        const lastChild = node.nodes[node.nodes.length - 1];
        const endLine = lastChild?.raws['litSourceEndLine'] as
          | number
          | undefined;
        if (endLine !== undefined) {
          const numAfterLines = after.split('\n').length - 1;
          this.builder(
            computeCorrectedString(
              after,
              endLine - numAfterLines,
              baseIndentations
            )
          );
        } else {
          this.builder(after);
        }
      } else {
        this.builder(after);
      }
    }

    this.builder(node.raws.codeAfter ?? '', node, 'end');
  }

  /** @inheritdoc */
  public override comment(node: Comment): void {
    const left = this.raw(node, 'left', 'commentLeft');
    const right = this.raw(node, 'right', 'commentRight');
    // The body's lines can be in `left` and `right` as well as `text`, such
    // as when the delimiters are on their own lines, so it's corrected whole.
    const body = `${left}${node.text}${right}`;
    this.builder(`/*${this._correctIndentation(node, body) ?? body}*/`, node);
  }

  /** @inheritdoc */
  public override raw(
    node: AnyNode,
    own: string,
    detect: string | undefined
  ): string | boolean {
    const root = node.root();
    const baseIndentations = root.raws['litBaseIndentations'] as
      | Map<number, number>
      | undefined;
    const startLine = node.raws['litSourceStartLine'] as number | undefined;

    if (baseIndentations && startLine !== undefined) {
      if (
        own === 'before' &&
        node.raws['before'] &&
        (node.raws['before'].includes('\n') || node.parent?.type === 'root')
      ) {
        const before = node.raws['before'] as string;
        const numBeforeLines = before.split('\n').length - 1;
        return computeCorrectedString(
          before,
          startLine - numBeforeLines,
          baseIndentations
        );
      }

      if (
        own === 'after' &&
        node.raws['after']?.includes('\n') &&
        node.type !== 'root'
      ) {
        const after = node.raws['after'] as string;
        const numAfterLines = after.split('\n').length - 1;
        const endLine = node.raws['litSourceEndLine'] as number | undefined;
        if (endLine !== undefined) {
          return computeCorrectedString(
            after,
            endLine - numAfterLines,
            baseIndentations
          );
        }
      }

      if (own === 'between' && node.raws['between']?.includes('\n')) {
        return computeCorrectedString(
          node.raws['between'] as string,
          startLine,
          baseIndentations
        );
      }
    }

    return super.raw(node, own, detect);
  }

  /** @inheritdoc */
  public override rawValue(node: AnyNode, prop: string): string | number {
    const value = (node as unknown as Record<string, unknown>)[prop];

    if (typeof value === 'string') {
      const correctedValue = this._correctIndentation(node, value);
      if (correctedValue !== undefined) {
        return correctedValue;
      }
    }

    return super.rawValue(node, prop);
  }

  /**
   * Restores the template's base indentation to the lines of a multi-line
   * value from the given node, or returns `undefined` if there's none to
   * restore.
   */
  protected _correctIndentation(
    node: AnyNode,
    value: string
  ): string | undefined {
    const root = node.root();
    const baseIndentations = root.raws['litBaseIndentations'] as
      | Map<number, number>
      | undefined;
    const startLine = node.raws['litSourceStartLine'] as number | undefined;
    const endLine = node.raws['litSourceEndLine'] as number | undefined;

    if (!baseIndentations || startLine === undefined || !value.includes('\n')) {
      return undefined;
    }

    const originalLineCount =
      endLine !== undefined ? endLine - startLine + 1 : undefined;
    return computeCorrectedString(
      value,
      startLine,
      baseIndentations,
      originalLineCount
    );
  }
}

export const stringify: StringifierFn = (
  node: AnyNode,
  builder: Builder
): void => {
  const str = new LitStringifier(builder);
  str.stringify(node);
};
