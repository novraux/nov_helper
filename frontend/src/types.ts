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
}
