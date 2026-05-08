import type { Meta, StoryObj } from '@storybook/react-vite';
import { Typography, Box } from '@mui/material';
import { AppCard } from './AppCard';

const SampleContent = () => (
  <Box>
    <Typography variant='h6' gutterBottom>
      Card Title
    </Typography>
    <Typography variant='body2' color='text.secondary'>
      This is a sample card body with some descriptive text to illustrate how
      content is displayed inside the card.
    </Typography>
  </Box>
);

const meta: Meta<typeof AppCard> = {
  title: 'Common/AppCard',
  component: AppCard,
  tags: ['autodocs'],
  args: {
    compact: false,
    noShadow: false,
  },
  argTypes: {
    compact: {
      control: 'boolean',
      description: 'Reduce internal padding for dense layouts',
    },
    noShadow: {
      control: 'boolean',
      description: 'Remove box shadow (e.g. inside another card)',
    },
    padding: {
      control: 'number',
      description: 'Override default padding (MUI spacing units)',
    },
  },
  decorators: [
    Story => (
      <Box sx={{ maxWidth: 400, p: 2 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AppCard>;

// ---------------------------------------------------------------------------
// Variant stories
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {},
  render: args => (
    <AppCard {...args}>
      <SampleContent />
    </AppCard>
  ),
};

export const Compact: Story = {
  args: { compact: true },
  render: args => (
    <AppCard {...args}>
      <SampleContent />
    </AppCard>
  ),
};

export const NoShadow: Story = {
  args: { noShadow: true },
  render: args => (
    <AppCard {...args}>
      <SampleContent />
    </AppCard>
  ),
};

export const CustomPadding: Story = {
  args: { padding: 4 },
  render: args => (
    <AppCard {...args}>
      <SampleContent />
    </AppCard>
  ),
};

export const CompactNoShadow: Story = {
  name: 'Compact + No Shadow',
  args: { compact: true, noShadow: true },
  render: args => (
    <AppCard {...args}>
      <SampleContent />
    </AppCard>
  ),
};
