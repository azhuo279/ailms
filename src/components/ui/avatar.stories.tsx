import type { Meta, StoryObj } from "@storybook/nextjs";
import { Avatar, AvatarGroup } from "./avatar";

/**
 * **Avatar** — represents a person or group in assignment, collaboration,
 * approval, or ownership patterns. Falls back from image to initials to a
 * generic icon. For small sizes, pair presence with text because status dots
 * alone can be hard to perceive.
 */
const meta: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  args: {
    name: "Priya Natarajan",
    size: "md",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    presence: { control: "select", options: [undefined, "online", "away", "offline"] },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

// ---------------------------------------------------------------------------
// Fallback chain: image -> initials -> icon
// ---------------------------------------------------------------------------
export const Initials: Story = { args: { name: "Priya Natarajan" } };
export const SingleWordName: Story = { args: { name: "Ops" } };
export const IconFallback: Story = { args: { name: undefined } };
export const WithImage: Story = {
  args: { name: "Mateo Alvarez", src: "https://i.pravatar.cc/80?img=12" },
};

// ---------------------------------------------------------------------------
// Size axis
// ---------------------------------------------------------------------------
export const Small: Story = { args: { size: "sm" } };
export const Medium: Story = { args: { size: "md" } };
export const Large: Story = { args: { size: "lg" } };

// ---------------------------------------------------------------------------
// Presence
// ---------------------------------------------------------------------------
export const PresenceOnline: Story = { args: { presence: "online" } };
export const PresenceAway: Story = { args: { presence: "away" } };
export const PresenceOffline: Story = { args: { presence: "offline" } };

// ---------------------------------------------------------------------------
// Group
// ---------------------------------------------------------------------------
export const Group: StoryObj<typeof AvatarGroup> = {
  render: () => (
    <AvatarGroup max={3}>
      <Avatar name="Priya Natarajan" />
      <Avatar name="Mateo Alvarez" />
      <Avatar name="Jun Cho" />
      <Avatar name="Elena Petrov" />
      <Avatar name="Sam Okafor" />
    </AvatarGroup>
  ),
};
