# postcss-lit

This is a work-in-progress of a PostCSS plugin which provides a custom syntax
to parse the CSS contained within tagged template literals.

For example:

```ts
class MyElement extends LitElement {
  static styles = css`
    .foo { color: hotpink; }
  `;
}
```

This custom syntax would extract the inner CSS and pass-through to PostCSS'
internal parser.
