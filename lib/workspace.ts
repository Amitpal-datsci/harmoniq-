/**
 * lib/workspace.ts — Multi-tenant Workspace & Channel definitions & fallbacks
 */

export interface ChannelItem {
  id: string;
  workspaceId: string;
  name: string;
  topic?: string | null;
  createdAt?: string;
}

export interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  ownerId?: string;
  role?: "ADMIN" | "MEMBER" | "GUEST";
  channels: ChannelItem[];
}

export const DEFAULT_CHANNELS: ChannelItem[] = [
  {
    id: "chan_general",
    workspaceId: "ws_harmonic_core",
    name: "general",
    topic: "Main accessibility workstation discussions",
  },
  {
    id: "chan_engineering",
    workspaceId: "ws_harmonic_core",
    name: "engineering",
    topic: "Sprint planning, PR reviews, & tactile telemetry sync",
  },
  {
    id: "chan_accessibility",
    workspaceId: "ws_harmonic_core",
    name: "accessibility",
    topic: "WCAG AAA, neurodivergent UI protocols, & AAC voice tests",
  },
];

export const DEFAULT_WORKSPACES: WorkspaceItem[] = [
  {
    id: "ws_harmonic_core",
    name: "Harmonic Core",
    slug: "harmonic-core",
    role: "ADMIN",
    channels: DEFAULT_CHANNELS,
  },
  {
    id: "ws_design_lab",
    name: "Design Systems Lab",
    slug: "design-lab",
    role: "MEMBER",
    channels: [
      {
        id: "chan_dl_tokens",
        workspaceId: "ws_design_lab",
        name: "tokens-and-color",
        topic: "Color palettes, contrast ratio verification",
      },
      {
        id: "chan_dl_haptics",
        workspaceId: "ws_design_lab",
        name: "haptic-feedback",
        topic: "Tactile micro-animations and responsive latency",
      },
    ],
  },
];
