import {NodePath} from '@babel/traverse';
import {TaggedTemplateExpression, Comment} from '@babel/types';

/**
 * Determines if a given comment is a postcss-lit-disable comment
 * @param {Comment} node Node to test
 * @return {boolean}
 */
export function isDisableComment(node: Comment): boolean {
  return (
    node.type === 'CommentLine' &&
    node.value.includes('postcss-lit-disable-next-line')
  );
}
/**
 * Determines if a node has a leading postcss-lit-disable comment
 * @param {NodePath<TaggedTemplateExpression>} path NodePath to test
 * @return {boolean}
 */
export function hasDisableComment(
  path: NodePath<TaggedTemplateExpression>
): boolean {
  // The comment could be above the parent node or directly above the statement
  const leadingComments = path.getStatementParent()?.node.leadingComments ??
    path.parent.leadingComments ??
    path.node.leadingComments;
  // There could be multiple preceding the comments
  return leadingComments?.some((comment) => isDisableComment(comment)) ?? false;
}

export type Position =
  | 'block'
  | 'statement'
  | 'default'
  | 'selector'
  | 'property'
  | 'comment';

const whitespacePattern = /\s/;

interface PlaceholderConfig {
  create(key: number): string;
  regex: RegExp;
}

export const defaultPlaceholder: PlaceholderConfig = {
  create(key) {
    return `POSTCSS_LIT_${key}`;
  },
  regex: /POSTCSS_LIT_(\d+)/
};

export const placeholderMapping: Partial<Record<Position, PlaceholderConfig>> =
  {
    block: {
      create(key) {
        return `/* POSTCSS_LIT_${key} */`;
      },
      regex: /\/\* POSTCSS_LIT_(\d+)\*\//
    },
    statement: {
      create(key) {
        return `/* POSTCSS_LIT_${key} */`;
      },
      regex: /\/\* POSTCSS_LIT_(\d+) \*\//
    },
    property: {
      create(key) {
        return `--POSTCSS_LIT_${key}`;
      },
      regex: /--POSTCSS_LIT_(\d+)/
    }
  };

/**
 * Computes the placeholder for an expression
 * @param {number} i Expression index
 * @param {string=} prefix Source prefix so far
 * @param {string=} suffix Source suffix
 * @return {string}
 */
export function createPlaceholder(
  i: number,
  prefix?: string,
  suffix?: string
): string {
  if (!prefix) {
    return defaultPlaceholder.create(i);
  }

  const position = computePossiblePosition(prefix, suffix);

  return (placeholderMapping[position] ?? defaultPlaceholder).create(i);
}

/**
 * Finds the first non-space character of a string
 * @param {string} str String to search
 * @return {string|null}
 */
function findFirstNonSpaceChar(str: string): string | null {
  for (let i = 0; i < str.length; i++) {
    const chr = str[i];

    if (chr === undefined) {
      return null;
    }

    if (whitespacePattern.test(chr)) {
      continue;
    }

    return chr;
  }

  return null;
}

/**
 * Computes whether the current position may be block-level or not,
 * such that we can choose a more appropriate placeholder.
 * @param {string} prefix Source prefix to scan
 * @param {string=} suffix Source suffix to scan
 * @return {boolean}
 */
function computePossiblePosition(prefix: string, suffix?: string): Position {
  let possiblyInComment = false;
  let possiblePosition: Position = 'default';
  for (let i = prefix.length; i > 0; i--) {
    const chr = prefix[i];
    if (possiblyInComment) {
      if (chr === '/' && prefix[i + 1] === '*') {
        possiblyInComment = false;
      }
      continue;
    } else {
      if (chr === '/' && prefix[i + 1] === '*') {
        possiblePosition = 'comment';
        break;
      }
    }
    if (chr === '*' && prefix[i + 1] === '/') {
      possiblyInComment = true;
      continue;
    }
    if (chr === ';') {
      possiblePosition = 'statement';
      break;
    }
    if (chr === ':') {
      possiblePosition = 'default';
      break;
    }
    if (chr === '}') {
      possiblePosition = 'block';
      break;
    }
    if (chr === '{') {
      possiblePosition = 'statement';
      break;
    }
  }

  if (suffix) {
    const nextChr = findFirstNonSpaceChar(suffix);

    switch (possiblePosition) {
      case 'block': {
        if (nextChr === '{') {
          possiblePosition = 'selector';
        }
        break;
      }

      case 'statement': {
        if (nextChr === ':') {
          possiblePosition = 'property';
        }
        break;
      }
    }
  }

  return possiblePosition;
}
