export interface TeamConfig {
    teamId: number;
    name: string;
    description: string;
}

export const TEAMS: Record<string, TeamConfig> = {
    team1: {
        teamId: 2,
        name: "Blue Team",
        description: "Detailed view of the Blue Team's activity.",
    },
    team2: {
        teamId: 3,
        name: "Red Team",
        description: "Detailed view of the Red Team's activity.",
    },
};

export const TEAM_OPTIONS = [
    { value: "1", label: "none" },
    ...Object.values(TEAMS).map(t => ({
        value: String(t.teamId),
        label: t.name.toLowerCase(),
    })),
];
