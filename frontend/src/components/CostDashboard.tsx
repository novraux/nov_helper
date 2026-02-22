import { Trend } from '../types';
import styles from './CostDashboard.module.css';

interface Props {
    trends: Trend[];
}

export function CostDashboard({ trends }: Props) {
    // Calculate stats
    const totalCost = trends.reduce((sum, t) => sum + (t.total_api_cost || 0), 0);
    const analyzedCount = trends.filter(t => t.analysis_cost > 0).length;
    const cachedCount = trends.filter(t =>
        t.last_scraped_at && t.last_scored_at &&
        new Date(t.last_scraped_at) > new Date(t.last_scored_at)
    ).length;
    const scoredCount = trends.filter(t => t.scoring_cost > 0 || t.score_groq !== null).length;

    const avgCostPerTrend = scoredCount > 0 ? totalCost / scoredCount : 0;
    const cacheRate = trends.length > 0 ? (cachedCount / trends.length) * 100 : 0;

    // Estimated savings from caching (assuming $0.02 per analysis)
    const estimatedSavings = cachedCount * 0.02;

    // Group by cost tiers
    const freeTrends = trends.filter(t => t.total_api_cost === 0).length;
    const cheapTrends = trends.filter(t => t.total_api_cost > 0 && t.total_api_cost < 0.01).length;
    const expensiveTrends = trends.filter(t => t.total_api_cost >= 0.01).length;

    return (
        <div className={styles.dashboard}>
            <div className={styles.header}>
                <h2 className={styles.title}>💰 API Cost Overview</h2>
                <p className={styles.subtitle}>Track spending and cache efficiency</p>
            </div>

            <div className={styles.grid}>
                {/* Total Cost Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardIcon}>💸</span>
                        <span className={styles.cardLabel}>Total Cost</span>
                    </div>
                    <div className={styles.cardValue}>${totalCost.toFixed(3)}</div>
                    <div className={styles.cardFooter}>
                        <span className={styles.stat}>{trends.length} trends tracked</span>
                    </div>
                </div>

                {/* Cache Hit Rate */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardIcon}>⚡</span>
                        <span className={styles.cardLabel}>Cache Hit Rate</span>
                    </div>
                    <div className={styles.cardValue}>{cacheRate.toFixed(0)}%</div>
                    <div className={styles.cardFooter}>
                        <span className={styles.stat}>{cachedCount} cached trends</span>
                    </div>
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${cacheRate}%` }}
                        />
                    </div>
                </div>

                {/* Savings */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardIcon}>💚</span>
                        <span className={styles.cardLabel}>Estimated Savings</span>
                    </div>
                    <div className={styles.cardValue}>${estimatedSavings.toFixed(2)}</div>
                    <div className={styles.cardFooter}>
                        <span className={styles.stat}>from smart caching</span>
                    </div>
                </div>

                {/* Avg Cost Per Trend */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardIcon}>📊</span>
                        <span className={styles.cardLabel}>Avg Cost / Trend</span>
                    </div>
                    <div className={styles.cardValue}>${avgCostPerTrend.toFixed(4)}</div>
                    <div className={styles.cardFooter}>
                        <span className={styles.stat}>{scoredCount} scored</span>
                    </div>
                </div>
            </div>

            {/* Breakdown */}
            <div className={styles.breakdown}>
                <h3 className={styles.breakdownTitle}>Cost Breakdown</h3>
                <div className={styles.breakdownGrid}>
                    <div className={styles.breakdownItem}>
                        <span className={styles.breakdownLabel}>🟢 Free (cached)</span>
                        <span className={styles.breakdownValue}>{freeTrends}</span>
                    </div>
                    <div className={styles.breakdownItem}>
                        <span className={styles.breakdownLabel}>🔵 Scored only</span>
                        <span className={styles.breakdownValue}>{cheapTrends}</span>
                    </div>
                    <div className={styles.breakdownItem}>
                        <span className={styles.breakdownLabel}>🟣 Analyzed (Claude)</span>
                        <span className={styles.breakdownValue}>{analyzedCount}</span>
                    </div>
                    <div className={styles.breakdownItem}>
                        <span className={styles.breakdownLabel}>💎 High-value (7+)</span>
                        <span className={styles.breakdownValue}>
                            {trends.filter(t => (t.score_groq ?? 0) >= 7).length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tips */}
            <div className={styles.tips}>
                <h3 className={styles.tipsTitle}>💡 Cost Optimization Tips</h3>
                <ul className={styles.tipsList}>
                    <li>Cache hit rate above 60% is excellent - you're saving money!</li>
                    <li>Trends are cached for 48h to reduce redundant API calls</li>
                    <li>Claude analysis limited to 3 per run to control costs</li>
                    <li>Only high-value trends (7+ score, 40+ interest) get analyzed</li>
                </ul>
            </div>
        </div>
    );
}
