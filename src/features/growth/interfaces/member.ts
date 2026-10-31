export type GrowthRole = "coordinador" | "prospector";
export type GrowthMemberStatus = "invited" | "active" | "suspended";

/** A whole municipio, or only some of its colonias. */
export interface GrowthZone {
  municipio: string;
  colonias?: string[];
}

/** Who is acting, resolved on every growth request; the SQL side checks the same role again. */
export interface GrowthActor {
  workspaceId: string;
  workspaceName: string;
  /** Set when the workspace belongs to a business; null for Tlaco's own. */
  tenantId: string | null;
  userId: string;
  role: GrowthRole;
  displayName: string;
  signature: string | null;
  whatsappE164: string | null;
  zones: GrowthZone[];
  dailyGoal: number;
}

export interface GrowthMemberStats {
  active: number;
  replied: number;
  registered: number;
}

export interface GrowthMember {
  user_id: string;
  role: GrowthRole;
  status: GrowthMemberStatus;
  display_name: string;
  signature: string | null;
  whatsapp_e164: string | null;
  zones: GrowthZone[];
  daily_goal: number;
  invited_at: string;
  joined_at: string | null;
  email: string | null;
  stats: GrowthMemberStats;
}

export interface GrowthTeam {
  members: GrowthMember[];
  /** Municipios with prospects that no active member covers. */
  uncovered: string[];
}

export interface MemberInviteInput {
  email: string;
  display_name: string;
  role: GrowthRole;
  whatsapp: string;
  signature: string;
  zones: GrowthZone[];
}

export interface MemberPatch {
  role?: GrowthRole;
  status?: GrowthMemberStatus;
  display_name?: string;
  whatsapp?: string;
  signature?: string;
  zones?: GrowthZone[];
  daily_goal?: number;
}

export interface MemberInviteResult {
  member: GrowthMember;
  emailDelivery: "sent" | "failed" | "not_needed";
}

/** What the browser needs to know about itself in prospecting: nothing when the user is not a member. */
export interface GrowthMe {
  actor: GrowthActor | null;
}

export interface MemberSheetProps {
  isOpen: boolean;
  member: GrowthMember | null;
  municipios: string[];
  busy: boolean;
  onClose: () => void;
  onInvite: (input: MemberInviteInput) => Promise<boolean>;
  onSave: (userId: string, patch: MemberPatch) => Promise<boolean>;
}

export interface ZonePickerProps {
  value: GrowthZone[];
  municipios: string[];
  onChange: (zones: GrowthZone[]) => void;
}

export interface TeamMemberCardProps {
  member: GrowthMember;
  isSelf: boolean;
  onEdit: (member: GrowthMember) => void;
}
