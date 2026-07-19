export interface TestCaseConfig {
  category: string;
  caseFileName: string;
  threshold: number;
  diffPercentage: number;
}

export type CategoryConfig = Record<string, TestCaseConfig>;
