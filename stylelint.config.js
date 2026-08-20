export default {
  extends: 'stylelint-config-standard',
  rules: {
    // Media Queries Level 4 range syntax (`width <= 991px`) is dropped wholesale
    // by browsers older than Chrome 104 / Firefox 102 / Safari 16.4 -- and this
    // site puts the mobile nav behind exactly such a query, so those browsers
    // would lose the hamburger entirely. Keep the widely supported prefix form.
    'media-feature-range-notation': 'prefix',

    // #id selectors are how this site's sections and nav are addressed.
    'selector-id-pattern': null,
    'custom-property-empty-line-before': null,
    'comment-empty-line-before': null,
    'no-descending-specificity': null
  }
}
