export type RadarChange = { domain: string; change: string; source: string };
export type RadarAction = { title: string; detail: string };

export type RadarRun = {
  run: string;
  delivered: string;
  sourceFile: string;
  kpi: {
    autodocRevenue: number | null;
    autodocB2b: number | null;
    fbaNet: number | null;
    euro7Days: number;
    openQuestions: number;
  };
  summary: string[];
  changes: RadarChange[];
  actions: RadarAction[];
  openQuestions: string[];
};

export const filterRadarRuns = (runs: RadarRun[], start: string, end: string) =>
  runs.filter((run) => run.run >= start && run.run <= end);
