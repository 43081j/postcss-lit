import {relative} from 'path';

import {minimatch} from 'minimatch';
import postcss from 'postcss';
import postcssLoadConfig, {
  type Result as PostcssConfig
} from 'postcss-load-config';
import {type Plugin} from 'rollup';

import {parse} from './parse.js';
import {stringify} from './stringify.js';

export interface RollupPostcssLitOptions {
  /**
   * Files matching any of these patterns will be processed by PostCSS-Lit.
   * For more information, see the [`glob` primer](https://github.com/isaacs/node-glob#glob-primer).
   * @default "**\/*.{js,ts}"
   */
  globInclude: string | string[];

  /**
   * Files matching any of these patterns will be excluded.
   * For more information, see the [`glob` primer](https://github.com/isaacs/node-glob#glob-primer).
   * @default ""
   */
  globExclude: string | string[];
}

/**
 * A Rollup plugin that processes CSS from template
 * literals inside JS/TS files using PostCSS.
 *
 * @param {Partial<RollupPostcssLitOptions>} options Optional plugin options.
 * @return {Plugin} A Rollup plugin object.
 */
export const RollupPostcssLit = (
  options: Partial<RollupPostcssLitOptions> = {}
): Plugin => {
  const globInclude = joinGlobs(options.globInclude ?? '**/*.{js,ts}');
  const globExclude = joinGlobs(options.globExclude ?? '');

  let cwd: string;
  let config: PostcssConfig;

  return {
    name: 'rollup-plugin-postcss-lit',
    async buildStart() {
      cwd = process.cwd();
      config = await postcssLoadConfig({syntax: {parse, stringify}});
    },
    async transform(code, id) {
      const path = relative(cwd, id);
      const isIncluded = minimatch(path, globInclude);
      const isExcluded = minimatch(path, globExclude);
      if (isIncluded && !isExcluded) {
        const result = await postcss(config.plugins).process(code, {
          ...config.options,
          from: id,
          to: id
        });
        return {code: result.css};
      }
      return undefined;
    }
  };
}

/**
 * Joins an array of glob patterns into a single, unified glob pattern.
 *
 * @param {string | string[]} pattern The glob pattern(s) to join.
 * @return {string} A single glob pattern string.
 */
function joinGlobs(pattern: string | string[]): string {
  if (!Array.isArray(pattern)) return pattern;
  if (!pattern[0]) return '';
  if (pattern.length === 1) return pattern[0];
  return `{${pattern.join(',')}}`;
}
