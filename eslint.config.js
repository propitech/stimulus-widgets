import neostandard from "neostandard";

// `noStyle` drops neostandard's stylistic rules so Prettier owns all formatting;
// eslint keeps only the correctness rules. Prevents the quotes/semis/spacing
// tug-of-war between the two tools.
export default [
  {
    ignores: [
      "node_modules/",
      "test/fixtures/dist/",
      "test-results/",
      "playwright-report/",
    ],
  },
  ...neostandard({ noStyle: true }),
];
