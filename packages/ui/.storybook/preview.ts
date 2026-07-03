import type { Preview } from '@storybook/react-vite';

// Load the Tailwind theme bridge globally: it pulls in Tailwind's generated
// utilities AND @imports tokens.css, so every story renders with both the
// compiled classes and the --rui-* custom properties set.
import '../src/tokens/theme.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: 'limestone',
      values: [
        { name: 'limestone', value: '#f4f2f0' },
        { name: 'ink', value: '#1a1919' },
      ],
    },
  },
};

export default preview;
