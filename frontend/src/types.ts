export interface Trend {
    id: number;
    keyword: string;
    source: string;
    score_groq: number | null;
    pod_viability: number | null;
    competition_level: string | null;
    ip_safe: boolean | null;
    product_suggestions: string[] | null;
    score_reasoning: string | null;
    design_brief: string | null;
    target_audience: string | null;
    deep_analysis: string | null;
    created_at: string;

    // Enhanced fields (Phase 1)
    last_scraped_at: string | null;
    scrape_count: number;
    last_scored_at: string | null;
    last_analyzed_at: string | null;
    days_trending: number;
    trend_velocity: 'rising' | 'stable' | 'declining' | null;
    peak_score: number | null;
    peak_date: string | null;
    avg_interest: number | null;
    interest_peak: number | null;
    interest_delta: number | null;
    temporal_tags: string[] | null;
    emoji_tag: string | null;
    urgency: 'urgent' | 'plan_ahead' | 'evergreen' | 'standard' | null;
    scoring_cost: number;
    analysis_cost: number;
    total_api_cost: number;
    validation_status: string | null;
    archived: boolean;
}
