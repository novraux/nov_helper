import * as React from 'react';
import { Trend } from '../types';
import { ScoreBadge, CompetitionBadge, IPBadge } from './ScoreBadge';
import styles from './TrendCard.module.css';

interface Props {
    trend: Trend;
}

export function TrendCard({ trend }: Props) {
    const [expanded, setExpanded] = React.useState(false);

    const sourceEmoji =
        trend.source === 'google' ? '🔍' :
            trend.source === 'tiktok' ? '🎵' :
                trend.source === 'pinterest' ? '📌' :
                    trend.source === 'redbubble' ? '🎨' :
                        trend.source === 'etsy' ? '🟠' : '✨';

    return (
        <div className={styles.card} onClick={() => setExpanded(!expanded)}>
            <div className={styles.header}>
                <div className={styles.left}>
                    <span className={styles.source}>{sourceEmoji} {trend.source}</span>
                    <h3 className={styles.keyword}>{trend.keyword}</h3>
                </div>
                <div className={styles.right}>
                    <ScoreBadge score={trend.score_groq} />
                </div>
            </div>

            <div className={styles.badges}>
                <CompetitionBadge level={trend.competition_level} />
                <IPBadge ipSafe={trend.ip_safe} />
            </div>

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
