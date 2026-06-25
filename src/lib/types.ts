import type { IssueCategory, IssueStatus } from "@/lib/domain";

/** Result of the Triage agent (Gemini, multimodal). */
export interface TriageResult {
  isCivicIssue: boolean;
  category: IssueCategory;
  severity: number; // 1-5
  title: string;
  description: string;
  hazards: string[];
  confidence: number; // 0-1
}

export interface Resolution {
  proofPath: string;
  verified: boolean;
  verifiedAt?: number;
  note?: string;
}

/** An issue as stored in Firestore / returned to the client. */
export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  severity: number;
  hazards: string[];
  status: IssueStatus;
  lat: number;
  lng: number;
  geohash: string;
  /** GCS object path, served via /api/media/<photoPath> */
  photoPath: string;
  confirmations: number;
  reporterId?: string;
  aiConfidence?: number;
  resolution?: Resolution;
  createdAt: number;
  updatedAt: number;
}

export type NewIssueInput = {
  imageBase64: string;
  mimeType: string;
  lat: number;
  lng: number;
  triage: TriageResult;
  reporterId?: string;
};
