import { useState } from 'react';
import { api } from '../api';
import styles from './NicheExplorer.module.css';

interface Competitor {
    title: string;
    price: string;
    url?: string;
    platform?: string;
}

interface ValidationResult {
    success: boolean;
    keyword: string;
    listing_count: number;
    price_stats: {
        min: number;
        max: number;
        avg: number;
        median: number;
    };
    market_gap_report: string;
    opportunity_score: number;
    platforms: {
        etsy: number;
        redbubble: number;
    };
    top_competitors: Competitor[];
}

export function NicheExplorer() {
    const [keyword, setKeyword] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ValidationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!keyword.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await api.exploreNiche(keyword);
            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Something went wrong during exploration.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Niche Explorer</h1>
                <p className={styles.subtitle}>Unified cross-platform validation & market gap analysis</p>

                <form className={styles.searchBox} onSubmit={handleSearch}>
                    <input
                        type="text"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="e.g. minimalist camping, retro coffee lover..."
                        className={styles.input}
                        disabled={loading}
                    />
                    <button type="submit" className={styles.searchButton} disabled={loading}>
                        {loading ? 'Analyzing...' : 'Deep Dive'}
                    </button>
                </form>
            </header>

            {loading && (
                <div className={styles.loadingArea}>
                    <div className={styles.spinner}></div>
                    <p>Scraping Etsy & Redbubble... Running AI Analysis...</p>
                </div>
            )}

            {error && (
                <div className={styles.errorCard}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {result && (
                <div className={styles.resultsArea}>
                    <div className={styles.statsRow}>
                        <div className={styles.scoreCard}>
                            <div className={styles.scoreCircle}>
                                <span className={styles.scoreValue}>{result.opportunity_score}</span>
                                <span className={styles.scoreLabel}>Vibe Score</span>
                            </div>
                            <div className={styles.scoreStatus}>
                                {result.opportunity_score > 70 ? 'High Opportunity' :
                                    result.opportunity_score > 40 ? 'Moderate Potential' : 'Risky / Saturated'}
                            </div>
                        </div>

                        <div className={styles.marketStats}>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Found Listings</span>
                                <span className={styles.statValue}>{result.listing_count}</span>
                                <span className={styles.statSub}>Etsy ({result.platforms.etsy}) + RB ({result.platforms.redbubble})</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Avg Market Price</span>
                                <span className={styles.statValue}>${result.price_stats.avg.toFixed(2)}</span>
                                <span className={styles.statSub}>Range: ${result.price_stats.min} - ${result.price_stats.max}</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.reportSection}>
                        <h2 className={styles.sectionTitle}>AI Market Opportunity Report</h2>
                        <div className={styles.reportContent}>
                            {result.market_gap_report.split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>
                    </div>

                    <h2 className={styles.sectionTitle}>Top Competition Examples</h2>
                    <div className={styles.competitorGrid}>
                        {result.top_competitors.map((comp, i) => (
                            <div key={i} className={styles.compCard}>
                                <div className={styles.compHeader}>
                                    <span className={styles.platformBadge}>{comp.platform || 'etsy'}</span>
                                    <span className={styles.compPrice}>${comp.price}</span>
                                </div>
                                <p className={styles.compTitle}>{comp.title}</p>
                                {comp.url && (
                                    <a href={comp.url} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>
                                        View Listing ↗
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
