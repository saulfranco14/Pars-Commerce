export interface TeamMember {
  id: string;
  user_id: string;
  role_id: string;
  role_name: string;
  display_name: string;
  email: string;
  status: "invited" | "active" | "suspended";
  invited_at?: string | null;
  invitation_expires_at?: string | null;
  suspended_at?: string | null;
  suspension_reason?: string | null;
}
