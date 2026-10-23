/** Colors resolve to CSS custom properties so the six themes swap everything at once. */
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'), gold: v('gold'), accentInk: v('accent-ink'), surface: v('surface'), sunk: v('sunk'), ink: v('text'), muted: v('muted'),
        accent: v('accent'), accent2: v('accent-2'), line: v('border'), ot: v('ot'), nt: v('nt'),
        good: v('good'), warn: v('warn'), bad: v('bad'),
      },
      fontFamily: {
        display: ['"Avenir Next"', '"AvenirNext"', '"Avenir Next LT Pro"', 'Avenir', '"Nunito Sans"', '"Noto Sans Tamil"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Avenir Next"', '"AvenirNext"', '"Avenir Next LT Pro"', 'Avenir', '"Nunito Sans"', '"Noto Sans Tamil"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', '"EB Garamond"', '"Noto Serif Tamil"', 'Georgia', 'serif'],
        orig: ['"Noto Serif Hebrew"', '"Noto Serif"', 'serif'],
      },
    },
  },
};
