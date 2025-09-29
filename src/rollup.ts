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
  let config: PostcssConfig;

  return {
    name: 'rollup-plugin-postcss-lit',
    async buildStart() {
      config = await postcssLoadConfig({syntax: {parse, stringify}});
    },
    transform: {
      filter: {
        id: {
          include: options.globInclude,
          exclude: options.globExclude
        }
      },
      async handler(code, id) {
        const result = await postcss(config.plugins).process(code, {
          ...config.options,
          from: id,
          to: id
        });
        return {code: result.css};
      }
    }
  };
};
