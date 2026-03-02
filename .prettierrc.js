/** @type {import('prettier').Config} */
module.exports = {
  // Formatting
  printWidth: 100,
  tabWidth: 4,
  useTabs: false,

  // Syntax preferences
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'all',
  arrowParens: 'avoid',
  bracketSpacing: true,
  bracketSameLine: false,

  // React / JSX
  jsxSingleQuote: false,

  // Misc
  endOfLine: 'auto',
};