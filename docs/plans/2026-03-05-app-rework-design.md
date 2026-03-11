# Activity Contest App - General Rework Design

## Date: 2026-03-05

## Requirements

1. **Inactive user detection** - Auto: 7+ days no activity OR bottom 25% of team, configurable thresholds
2. **Team change** - Free switching, historical points stay with old team
3. **Name editing** - In user profile
4. **Activity proofs** - Photo/screenshot uploads (improve existing)
5. **Charts** - Full dashboard: bar, line, pie, radar, heatmap, weekly trends, individual progress
6. **Leaderboard** - Individual + team rankings
7. **Team comparison** - Visual stats comparison
8. **Dynamic teams** - Admin creates any number with custom names and colors
9. **Activity types** - Admin edits/adds types with custom multipliers
10. **Professional UI** - Navbar, breadcrumbs, dark/light mode, animations
11. **Mobile responsive** - Hamburger menu, touch-friendly

## Approach: B - Evolution + Enhanced UI

Existing stack (Next.js + Supabase + shadcn/ui + Recharts) plus:
- next-themes (dark/light mode)
- framer-motion (animations)
- zustand (state management)

## Database Schema

### Tables

```sql
app_config (id, key UNIQUE, value, updated_at)
teams (id, name, color, created_at)
activity_types (id, name, multiplier, icon, created_at)
people (id UUID, name, team_id FK, is_admin, created_at)
activities (id, person_id FK, team_id FK, activity_type_id FK, value, points, proof_url, created_at)
```

### Materialized Views
- mv_people_stats: person, total_points, last_activity, streak
- mv_team_stats: team, total_points, member_count

## Routing

```
/                    -> Dashboard (charts, summary, heatmap)
/leaderboard         -> Leaderboard (individual + team)
/teams               -> Team list with comparison
/teams/[id]          -> Team details (members, charts, stats)
/profile             -> User profile (edit name, log activity, history, proofs)
/admin               -> Admin panel
/admin/teams         -> Team management (CRUD)
/admin/activities    -> Activity type management (CRUD)
/admin/config        -> Configuration (inactivity thresholds)
/admin/randomizer    -> Team randomizer
```

## Navigation

- Top navbar: Dashboard | Leaderboard | Teams | Profile | Admin (admin only)
- Breadcrumbs below navbar
- Mobile: hamburger with animated slideout
- Dark/light mode toggle in navbar

## Charts

| Chart | Data | Location |
|-------|------|----------|
| Bar | Team points comparison | Dashboard, /teams |
| Line | Daily points progress | Dashboard, /teams/[id] |
| Pie | Member contribution in team | /teams/[id] |
| Radar | Activity types per team | /teams comparison |
| Heatmap | User activity (GitHub style) | /profile |
| Weekly trend | Bars per weekday | Dashboard |
| Individual progress | Personal line chart | /profile |

## Key Decisions

- Points calculated at write time (value x multiplier stored in `points` column)
- Team ID stored per activity entry (historical, doesn't change on team switch)
- Inactive detection runs client-side from last_activity and percentile
- All thresholds configurable via app_config table
