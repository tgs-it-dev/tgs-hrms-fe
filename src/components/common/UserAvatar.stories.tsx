import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Stack, Typography } from '@mui/material';
import UserAvatar from './UserAvatar';

// ---------------------------------------------------------------------------
// Storybook cannot easily mock React contexts (ProfilePictureContext,
// UserContext). We provide minimal stub decorators so UserAvatar renders
// its initials fallback path without needing a full app context tree.
// ---------------------------------------------------------------------------

const mockUser = {
  id: '1',
  first_name: 'Alice',
  last_name: 'Smith',
  profile_pic: null,
};

const mockUserWithPic = {
  id: '2',
  first_name: 'Bob',
  last_name: 'Jones',
  // A real remote URL would normally be set here.
  profile_pic: 'https://i.pravatar.cc/150?img=3',
};

const meta: Meta<typeof UserAvatar> = {
  title: 'Common/UserAvatar',
  component: UserAvatar,
  tags: ['autodocs'],
  args: {
    user: mockUser,
    size: 40,
    clickable: false,
  },
  argTypes: {
    size: {
      control: { type: 'range', min: 24, max: 120, step: 8 },
      description: 'Avatar diameter in pixels',
    },
    clickable: {
      control: 'boolean',
      description: 'Show pointer cursor and hover scale effect',
    },
  },
  decorators: [
    Story => (
      <Box sx={{ p: 3 }}>
        <Story />
      </Box>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UserAvatar>;

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

export const InitialsFallback: Story = {
  name: 'Initials (no photo)',
  args: { user: mockUser, size: 48 },
};

export const WithPhoto: Story = {
  name: 'With profile picture',
  args: { user: mockUserWithPic, size: 48 },
};

export const Clickable: Story = {
  args: { user: mockUser, size: 48, clickable: true },
};

export const SmallSize: Story = {
  args: { user: mockUser, size: 24 },
};

export const LargeSize: Story = {
  args: { user: mockUser, size: 96 },
};

export const SizeScale: Story = {
  name: 'Size scale',
  render: () => (
    <Stack direction='row' spacing={2} alignItems='center'>
      {[24, 32, 40, 56, 72, 96].map(size => (
        <Box key={size} textAlign='center'>
          <UserAvatar user={mockUser} size={size} />
          <Typography variant='caption' display='block' mt={0.5}>
            {size}px
          </Typography>
        </Box>
      ))}
    </Stack>
  ),
};

export const MultipleUsers: Story = {
  name: 'Multiple users (stacked)',
  render: () => {
    const users = [
      { id: '1', first_name: 'Alice', last_name: 'Smith', profile_pic: null },
      { id: '2', first_name: 'Bob', last_name: 'Jones', profile_pic: null },
      { id: '3', first_name: 'Carol', last_name: 'Wu', profile_pic: null },
      { id: '4', first_name: 'Dave', last_name: 'Lee', profile_pic: null },
    ];
    return (
      <Stack direction='row' spacing={-1}>
        {users.map(u => (
          <UserAvatar
            key={u.id}
            user={u}
            size={40}
            sx={{ border: '2px solid white' }}
          />
        ))}
      </Stack>
    );
  },
};
