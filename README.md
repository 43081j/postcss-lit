# postcss-lit

A PostCSS and stylelint custom syntax for parsing CSS inside
[lit](https://lit.dev) templates.

For example:

```ts
class MyElement extends LitElement {
  static styles = css`
    .foo { color: hotpink; }
  `;
}
```

## Install

```sh
npm i -D postcss-lit
```

## Usage with PostCSS

In your `postcss.config.js`:

```ts
module.exports = {
  syntax: 'postcss-lit',
  plugins: [...]
};
```

## Usage with stylelint

In your `.stylelintrc.json` (or other stylelint config file):

```ts
{
  "customSyntax": "postcss-lit"
}
```

Or with the CLI:

```sh
stylelint --custom-syntax postcss-lit
```
