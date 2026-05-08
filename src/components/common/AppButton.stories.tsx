import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppButton } from './AppButton';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';

const meta: Meta<typeof AppButton> = {
  title: 'Common/AppButton',
  component: AppButton,
  tags: ['autodocs'],
  args: {
    text: 'Button',
    loading: false,
    disabled: false,
  },
  argTypes: {
    variantType: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
      description: 'Visual style variant',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state (disables button)',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppButton>;

// ---------------------------------------------------------------------------
// Variant stories
// ---------------------------------------------------------------------------

export const Primary: Story = {
  args: { variantType: 'primary', text: 'Save Changes' },
};

export const Secondary: Story = {
  args: { variantType: 'secondary', text: 'Cancel' },
};

export const Danger: Story = {
  args: { variantType: 'danger', text: 'Delete Record' },
};

export const Ghost: Story = {
  args: { variantType: 'ghost', text: 'More Options' },
};

// ---------------------------------------------------------------------------
// State stories
// ---------------------------------------------------------------------------

export const Loading: Story = {
  args: { variantType: 'primary', text: 'Saving…', loading: true },
};

export const Disabled: Story = {
  args: { variantType: 'primary', text: 'Unavailable', disabled: true },
};

export const DisabledDanger: Story = {
  args: { variantType: 'danger', text: 'Delete', disabled: true },
};

// ---------------------------------------------------------------------------
// With icons
// ---------------------------------------------------------------------------

export const WithStartIcon: Story = {
  args: {
    variantType: 'primary',
    text: 'Save',
    startIcon: <SaveIcon />,
  },
};

export const WithEndIcon: Story = {
  args: {
    variantType: 'danger',
    text: 'Delete',
    endIcon: <DeleteIcon />,
  },
};

// ---------------------------------------------------------------------------
// Responsive / size variants
// ---------------------------------------------------------------------------

export const FullWidth: Story = {
  args: {
    variantType: 'primary',
    text: 'Submit Form',
    fullWidth: true,
  },
};
