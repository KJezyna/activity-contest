interface RawMemberData {
    person: number;
    Name: string;
    team: number;
    total_distance: number;
}

interface RawTeamData {
    total_distance: number;
}

export interface ITableData {
    id: number;
    name: string;
    score: number;
    percent: number;
}

export function processTeamData(
    data1: RawMemberData[] | null,
    data2: RawTeamData | null
): ITableData[]{
    if(data1 && data2){
        const totalScore = data2.total_distance || 1;

        return data1.map((item) => {
            const percent = (item.total_distance/totalScore) * 100;

            return {
                id: item.person,
                name: item.Name || `Osoba ${item.person}`,
                score: item.total_distance,
                percent: percent || 0
            };
        });
    }
    return[];
}
