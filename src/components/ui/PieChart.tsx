"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
    ChartContainer,
    ChartTooltipContent,
} from "@/components/ui/chart"

interface IChartPieSimpleProps {
    team1percent: number;
    team2percent: number;
    team1value: number;
    team2value: number;
}
export function ChartPieSimple({team1percent, team2percent, team1value, team2value}: IChartPieSimpleProps) {

    const data = [
        { name: 'Team 1', value: team1percent, distance: team1value, fill: '#3b82f6' },
        { name: 'Team 2', value: team2percent, distance: team2value, fill: '#ef4444' },
    ];

    const COLORS = ['#3b82f6', '#ef4444'];

    return (
        <ChartContainer
            config={{
            }}
            className="mx-auto aspect-square h-[350px] w-full"
        >
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={150}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    cursor={false}
                    content={
                        <ChartTooltipContent
                            formatter={(value, name, entry) => `${Math.round(Number(value))}% ${entry.payload.distance} points`}
                        />
                    }
                />
            </PieChart>
        </ResponsiveContainer>
        </ChartContainer>
    );
}
