import type { Preview } from '@storybook/react-vite';

// Load the design tokens globally so every story renders with --rui-* set.
import '../src/tokens/tokens.css';

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
