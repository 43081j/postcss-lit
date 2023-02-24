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

### PostCSS with webpack

If you use webpack to execute postcss, you must ensure the right order of
loaders, like so:

```ts
module.exports = {
  entry: './src/my-element.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['postcss-loader', 'ts-loader'],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts']
  },
  output: {
    filename: 'bundle.js'
  }
};
```

This is important as postcss will transform your CSS _before_ typescript
transpiles to JS (which is what you want to happen).

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
    files: ['./src/**/*.{js,ts}'],
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

You **must** specify all
[tailwind directives](https://tailwindcss.com/docs/functions-and-directives)
you intend to use in your CSS, otherwise their replacement CSS will be
incorrectly appended to the end of the document.

For example, in the code above, `@tailwind base` and `@tailwind utilities`
were specified to make `text-xs` available. Without them, the code would not
build.

### Tailwind with webpack

See the same advice as with postcss standalone, [here](#postcss-with-webpack).

## Disable specific templates

You can use `postcss-lit-disable-next-line` to disable a particular template
from being processed:

```ts
// postcss-lit-disable-next-line
css`some template`;
```

These templates will be left as-is and won't make their way through postcss.

## Note on expressions/interpolation

Often you may end up with expressions in your templates. For example:

```ts
css`
  .foo {
    color: ${expr};
  }
`;
```

These can be very difficult to support at build-time since we have no useful
run-time information for what the expression might be.

Due to these difficulties, we officially support _complete_ syntax being
interpolated, though other cases may still work.

A few **supported** examples:

```ts
// Entire selector bound in
css`
  ${expr} {
    color: hotpink;
  }
`;

// Entire property bound in
css`
  .foo {
    ${expr}: hotpink;
  }
`;

// Entire value bound in
css`
  .foo {
    color: ${expr};
  }
`;

// Entire statement bound in
css`
  .foo {
    ${expr}
  }
`;

// Entire block bound in
css`
  .foo {}
  ${expr}
`;
```

And a few **unsupported** examples (though some _may_ work, they are not
officially supported):

```ts
// Part of a selector bound in
css`
  .foo, ${expr} {
    color: hotpink;
  }
`;

// Part of a value bound in
css`
  .foo {
    color: hot${expr};
  }
`;

// Part of a property bound in
css`
  .foo {
    col${expr}: hotpink;
  }
`;
```

In cases we fail to parse, we will raise a warning in the console and skip
the template (i.e. leave it untouched and won't process it).

You can then use a `// postcss-lit-disable-next-line` comment to silence the
warning.

## Custom babel options

You may customise the babel options via your `package.json`:

```json
{
  "postcss-lit": {
    "babelOptions": {
    }
  }
}
```

The available options are listed
[here](https://babeljs.io/docs/babel-parser#options).
