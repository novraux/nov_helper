import * as React from 'react';
import { Trend } from '../types';
import { ScoreBadge, CompetitionBadge, IPBadge, MomentumBadge, UrgencyBadge, InterestBadge, CostBadge } from './ScoreBadge';
import styles from './TrendCard.module.css';

interface Props {
    trend: Trend;
    onGenerateDesign?: () => void;
}

export function TrendCard({ trend, onGenerateDesign }: Props) {
    const [expanded, setExpanded] = React.useState(false);

    const sourceEmoji =
        trend.source === 'google' ? '🔍' :
            trend.source === 'tiktok' ? '🎵' :
                trend.source === 'pinterest' ? '📌' :
                    trend.source === 'redbubble' ? '🎨' :
                        trend.source === 'etsy' ? '🟠' : '✨';

    // Helper: format time ago
    const formatTimeAgo = (dateString: string | null): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        return 'just now';
    };

    // Check if trend was recently cached (not rescored)
    const isCached = !!(trend.last_scraped_at && trend.last_scored_at &&
        new Date(trend.last_scraped_at) > new Date(trend.last_scored_at));

    return (
        <div
            className={styles.card}
            onClick={() => {
                if (onGenerateDesign) {
                    onGenerateDesign();
                } else {
                    setExpanded(!expanded);
                }
            }}
            style={{ cursor: onGenerateDesign ? 'pointer' : 'default' }}
        >
            <div className={styles.header}>
                <div className={styles.left}>
                    <div className={styles.titleRow}>
                        {trend.emoji_tag && (
                            <span className={styles.emojiTag}>{trend.emoji_tag}</span>
                        )}
                        <h3 className={styles.keyword}>{trend.keyword}</h3>
                    </div>
                    <div className={styles.metaRow}>
                        <span className={styles.source}>{sourceEmoji} {trend.source}</span>
                        {trend.scrape_count > 1 && (
                            <span className={styles.meta}>• Seen {trend.scrape_count}x</span>
                        )}
                        {trend.last_scraped_at && (
                            <span className={styles.meta}>• {formatTimeAgo(trend.last_scraped_at)}</span>
                        )}
                    </div>
                </div>
                <div className={styles.right}>
                    <ScoreBadge score={trend.score_groq} />
                </div>
            </div>

            <div className={styles.badges}>
                <MomentumBadge velocity={trend.trend_velocity} />
                <UrgencyBadge urgency={trend.urgency} />
                <CompetitionBadge level={trend.competition_level} />
                <IPBadge ipSafe={trend.ip_safe} />
                {trend.avg_interest !== null && trend.avg_interest !== undefined && (
                    <InterestBadge interest={trend.avg_interest} />
                )}
                <CostBadge cost={trend.total_api_cost} cached={isCached} />
            </div>

            {/* Temporal tags */}
            {trend.temporal_tags && trend.temporal_tags.length > 0 && (
                <div className={styles.temporalTags}>
                    {trend.temporal_tags.slice(0, 5).map((tag, i) => (
                        <span key={i} className={styles.temporalTag}>{tag}</span>
                    ))}
                </div>
            )}

            {trend.score_reasoning && (
                <p className={styles.reasoning}>{trend.score_reasoning}</p>
            )}

            {trend.product_suggestions && trend.product_suggestions.length > 0 && (
                <div className={styles.products}>
                    {trend.product_suggestions.map((p, i) => (
                        <span key={i} className={styles.product}>{p}</span>
                    ))}
                </div>
            )}

            {/* Expanded — deep analysis (Claude) */}
            {expanded && (trend.deep_analysis || trend.design_brief) && (
                <div className={styles.deepAnalysis} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.divider} />
                    {trend.design_brief && (
                        <div className={styles.section}>
                            <h4>🎨 Design Brief</h4>
                            <p>{trend.design_brief}</p>
                        </div>
                    )}
                    {trend.target_audience && (
                        <div className={styles.section}>
                            <h4>👥 Target Audience</h4>
                            <p>{trend.target_audience}</p>
                        </div>
                    )}
                    {!trend.design_brief && trend.deep_analysis && (
                        <p className={styles.rawanalysis}>{trend.deep_analysis}</p>
                    )}

                </div>
            )}

            {(trend.deep_analysis || trend.design_brief) && (
                <button
                    className={styles.expandBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                    }}
                >
                    {expanded ? '▲ Collapse' : '▼ Deep Analysis'}
                </button>
            )}
        </div>
    );
}
