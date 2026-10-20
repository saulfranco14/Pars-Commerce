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
  /** The business created this account and may set its password. */
  can_set_password?: boolean;
}

/** What the owner hands over so a staff member can log in. */
export interface StaffCredentials {
  /** Username or email, whichever the person types to log in. */
  login: string;
  password: string;
}
