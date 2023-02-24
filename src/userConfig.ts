import {lilconfigSync as lilconfig} from 'lilconfig';
import {ParserOptions} from '@babel/parser';

export interface UserConfig {
  babelOptions: ParserOptions;
}

const defaultConfig: UserConfig = {
  babelOptions: {
    sourceType: 'unambiguous',
    plugins: [
      'typescript',
      ['decorators', {decoratorsBeforeExport: true}],
      'jsx'
    ],
    ranges: true
  }
};

/**
 * Gets the postcss-lit config from package.json if it exists
 * @param {string} key Config key to search for
 * @return {PackageConfig}
 */
export function getUserConfig(key: string): UserConfig {
  const result = lilconfig(key, {
    searchPlaces: ['package.json']
  }).search();

  const userConfig = result ? result.config : {};

  return {
    babelOptions: {
      ...defaultConfig.babelOptions,
      ...userConfig?.babelOptions
    }
  };
}
