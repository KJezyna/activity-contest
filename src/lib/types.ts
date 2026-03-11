export interface Team {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface ActivityType {
  id: number;
  name: string;
  multiplier: number;
  icon: string;
  created_at: string;
}

export interface Person {
  id: string;
  name: string;
  team_id: number | null;
  is_admin: boolean;
  created_at: string;
}

export interface Activity {
  id: number;
  person_id: string;
  team_id: number | null;
  activity_type_id: number;
  value: number;
  points: number;
  proof_url: string | null;
  created_at: string;
}

export interface PersonStats {
  person_id: string;
  name: string;
  team_id: number | null;
  total_points: number;
  last_activity: string | null;
  active_days: number;
}

export interface TeamStats {
  team_id: number;
  team_name: string;
  team_color: string;
  total_points: number;
  active_members: number;
  total_members: number;
}

export interface AppConfig {
  id: number;
  key: string;
  value: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  person_id: string;
  name: string;
  team_id: number | null;
  total_points: number;
  last_activity: string | null;
  is_inactive: boolean;
}

export interface Badge {
  id: number;
  key: string;
  name: string;
  description: string;
  icon: string;
}

export interface UserBadge {
  id: number;
  person_id: string;
  badge_id: number;
  earned_at: string;
  badges?: Badge;
}

export interface ProofReaction {
  id: number;
  activity_id: number;
  person_id: string;
  emoji: string;
  created_at: string;
}

export interface TeamChange {
  id: number;
  person_id: string;
  old_team_id: number | null;
  new_team_id: number | null;
  changed_at: string;
}

export interface ProofComment {
  id: number;
  activity_id: number;
  person_id: string;
  text: string;
  created_at: string;
  people?: { name: string };
}
