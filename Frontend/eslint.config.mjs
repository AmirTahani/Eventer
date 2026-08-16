/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**', 'src/generated/**'],
  },
];

export default eslintConfig;
