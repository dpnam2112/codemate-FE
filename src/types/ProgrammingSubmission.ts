import { ProgrammingTestCase } from './ProgrammingTestCase';
type Status = 'pending' | 'completed' | 'failed';

export interface ProgrammingSubmissionStat {
  id: string;
  user_id: string;
  exercise_id: string;
  judge0_language_id: number;
  status: Status;
  passed_testcases: number;
  total_testcases: number;
}

export interface ProgrammingTestResult {
  id: string; // UUID
  submission_id: string; // UUID
  testcase_id: string; // UUID
  judge0_token: string;
  status: string;
  stdout?: string | null;
  stderr?: string | null;
  time?: number | null;
  memory?: number | null;
  testcase: ProgrammingTestCase;
  created_at: Date;
  updated_at: Date;
}

export interface ProgrammingSubmission {
  id: string; // UUID
  user_id: string;
  exercise_id: string;
  judge0_language_id: number;
  code: string;
  status: string;
  score?: number | null;
  test_results: ProgrammingTestResult[];
  created_at: Date;
  updated_at: Date;
}
