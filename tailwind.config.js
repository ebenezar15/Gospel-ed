/** Colors resolve to CSS custom properties so the six themes swap everything at once. */
const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'), surface: v('surface'), sunk: v('sunk'), ink: v('text'), muted: v('muted'),
        accent: v('accent'), accent2: v('accent-2'), line: v('border'), ot: v('ot'), nt: v('nt'),
        good: v('good'), warn: v('warn'), bad: v('bad'),
      },
      fontFamily: {
        display: ['"IM Fell English"', 'Georgia', 'serif'],
        serif: ['Spectral', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        orig: ['"Noto Serif Hebrew"', '"Noto Serif"', 'serif'],
      },
    },
  },
};
