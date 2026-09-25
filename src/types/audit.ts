export interface RawBusinessInput {
  business_name: string;
  category: string;
  city: string;
  phone?: string | null;
  website?: string | null;
  google_rating?: number | null;
  reviews_count?: number | null;
  unclaimed_profile?: boolean | null;
  pagespeed_mobile_score?: number | null;
  ssl_active?: boolean | null;
}

export type LeadPriority = 'ALTA' | 'MEDIA' | 'BASSA';

export type OpportunityTag =
  | 'NO_WEBSITE'
  | 'WEBSITE_CRITICAL'
  | 'GBP_UNCLAIMED'
  | 'GBP_LOW_REVIEWS'
  | 'GBP_POOR_RATING';

export interface AuditResult {
  business_name: string;
  lead_priority: LeadPriority;
  lead_score: number; // 0 - 100
  tags: OpportunityTag[];
  main_problems: string[];
  suggested_services: string[];
  sales_pitch_hook: string;
  // Raw data preserved for full context
  raw: RawBusinessInput;
  pipeline_status?: 'NUOVO' | 'DA_CONTATTARE' | 'IN_TRATTATIVA' | 'CHIUSO_VINTO' | 'PERSO';
  ai_pitch_details?: {
    call_script: string;
    email_icebreaker: string;
    whatsapp_pitch: string;
    value_proposition: string;
    objection_answer: string;
  };
}

export type SegmentFilter =
  | 'ALL'
  | 'NO_WEBSITE'
  | 'WEBSITE_CRITICAL'
  | 'GBP_IMPROVABLE'
  | 'PRIORITY_HIGH'
  | 'PRIORITY_MEDIUM'
  | 'PRIORITY_LOW';
