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

### Usage with vscode-stylelint

In order to make the
[vscode-stylelint](https://github.com/stylelint/vscode-stylelint)
extension work with this syntax correctly, you must configure it
to validate JS and/or TypeScript files.

You can do this by following these
[instructions](https://github.com/stylelint/vscode-stylelint#stylelintvalidate).

For example:

```json
{
  "stylelint.validate": ["css", "javascript", "typescript"]
}
```

## Usage with tailwind

In your `postcss.config.js`:

```ts
module.exports = {
  syntax: 'postcss-lit',
  plugins: {
    tailwindcss: {}
  }
};
```

In your `tailwind.config.js`:

```ts
const {tailwindTransform} = require('postcss-lit');

module.exports = {
  content: {
    files: ['./src/**/*.ts'],
    transform: {
      ts: tailwindTransform
    }
  }
};
```

You may then use tailwind's directives and classes in your elements:

```ts
class MyElement extends LitElement {
  static styles = css`
    @tailwind base;
    @tailwind utilities;
  `;

  render() {
    return html`
      <div class="text-xs">Small text</div>
    `;
  }
}
```
