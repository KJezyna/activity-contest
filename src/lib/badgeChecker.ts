import { supabase } from "@/lib/supabase";
import type { Activity, Badge } from "@/lib/types";

export async function checkAndAwardBadges(personId: string): Promise<string[]> {
  const [activitiesRes, badgesRes, earnedRes, activityTypesRes, reactionsGivenRes, reactionsReceivedRes] = await Promise.all([
    supabase.from("activities").select("*").eq("person_id", personId).order("created_at"),
    supabase.from("badges").select("*"),
    supabase.from("user_badges").select("badge_id").eq("person_id", personId),
    supabase.from("activity_types").select("id"),
    supabase.from("proof_reactions").select("id").eq("person_id", personId),
    supabase.from("proof_reactions").select("id, activity_id, activities!inner(person_id)").neq("activities.person_id", personId),
  ]);

  const activities = (activitiesRes.data as Activity[]) ?? [];
  const allBadges = (badgesRes.data as Badge[]) ?? [];
  const earnedIds = new Set((earnedRes.data ?? []).map((e: { badge_id: number }) => e.badge_id));
  const totalActivityTypes = (activityTypesRes.data ?? []).length;

  const totalPoints = activities.reduce((s, a) => s + a.points, 0);
  const proofCount = activities.filter((a) => a.proof_url).length;
  const uniqueTypes = new Set(activities.map((a) => a.activity_type_id)).size;
  const maxSinglePoints = activities.length > 0 ? Math.max(...activities.map((a) => a.points)) : 0;

  // Reactions given by this user
  const reactionsGivenCount = (reactionsGivenRes.data ?? []).length;

  // Reactions received on this user's proofs
  const myActivityIds = new Set(activities.filter((a) => a.proof_url).map((a) => a.id));
  const reactionsReceivedCount = (reactionsReceivedRes.data ?? []).filter(
    (r: { activity_id: number }) => myActivityIds.has(r.activity_id)
  ).length;

  // Calculate streak
  const uniqueDays = [...new Set(activities.map((a) => new Date(a.created_at).toDateString()))];
  const sortedDays = uniqueDays.map((d) => new Date(d)).sort((a, b) => b.getTime() - a.getTime());
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < sortedDays.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    expected.setHours(0, 0, 0, 0);
    const day = new Date(sortedDays[i]);
    day.setHours(0, 0, 0, 0);
    if (day.getTime() === expected.getTime()) streak++;
    else break;
  }

  // Check time-based badges
  const hasEarlyBird = activities.some((a) => new Date(a.created_at).getHours() < 6);
  const hasNightOwl = activities.some((a) => new Date(a.created_at).getHours() >= 23);

  // Check comeback: activity today after 21+ day gap
  let hasComeback = false;
  if (sortedDays.length >= 2) {
    for (let i = 0; i < sortedDays.length - 1; i++) {
      const gap = (sortedDays[i].getTime() - sortedDays[i + 1].getTime()) / 86400000;
      if (gap >= 21) { hasComeback = true; break; }
    }
  }

  // Check person has a team
  const { data: person } = await supabase.from("people").select("team_id").eq("id", personId).maybeSingle();
  const hasTeam = person?.team_id != null;

  // Count already earned + about-to-be-earned badges for collector check
  const currentEarnedCount = earnedIds.size;

  const checks: Record<string, boolean> = {
    first_activity: activities.length > 0,
    streak_3: streak >= 3,
    streak_7: streak >= 7,
    streak_14: streak >= 14,
    streak_30: streak >= 30,
    points_10: totalPoints >= 10,
    points_50: totalPoints >= 50,
    points_100: totalPoints >= 100,
    points_500: totalPoints >= 500,
    proof_5: proofCount >= 5,
    proof_20: proofCount >= 20,
    proof_50: proofCount >= 50,
    variety_3: uniqueTypes >= 3,
    variety_all: totalActivityTypes > 0 && uniqueTypes >= totalActivityTypes,
    team_player: hasTeam,
    early_bird: hasEarlyBird,
    night_owl: hasNightOwl,
    comeback: hasComeback,
    marathon: maxSinglePoints >= 10,
    star_proof: reactionsReceivedCount >= 10,
    motivator: reactionsGivenCount >= 10,
    collector: currentEarnedCount >= 5,
  };

  const newBadges: string[] = [];

  for (const badge of allBadges) {
    if (earnedIds.has(badge.id)) continue;
    if (checks[badge.key]) {
      const { error } = await supabase.from("user_badges").insert({
        person_id: personId,
        badge_id: badge.id,
      });
      if (!error) newBadges.push(badge.name);
    }
  }

  return newBadges;
}
