import { useState, useEffect, useCallback } from 'react';
import { Trend } from '../types';
import { TrendCard } from '../components/TrendCard';
import { CostDashboard } from '../components/CostDashboard';
import { api } from '../api';
import styles from './TrendFeed.module.css';

type FilterScore = 'all' | '7+' | '4+';
type FilterIP = 'all' | 'safe';
type FilterSource = 'all' | 'google' | 'tiktok' | 'pinterest' | 'redbubble' | 'etsy';
type FilterVelocity = 'all' | 'rising' | 'stable' | 'declining';
type FilterUrgency = 'all' | 'urgent' | 'plan_ahead' | 'evergreen';

interface Props {
    onNavigate?: (page: 'explorer' | 'trends' | 'seo' | 'orders', payload?: string) => void;
}

export function TrendFeed({ onNavigate }: Props) {
    const [trends, setTrends] = useState<Trend[]>([]);
    const [loading, setLoading] = useState(true);
    const [scraping, setScraping] = useState(false);
    const [scrapeProgress, setScrapeProgress] = useState(0);
    const [scrapeStatus, setScrapeStatus] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [filterScore, setFilterScore] = useState<FilterScore>('all');
    const [filterIP, setFilterIP] = useState<FilterIP>('all');
    const [filterSource, setFilterSource] = useState<FilterSource>('all');
    const [filterComp, setFilterComp] = useState<string>('all');
    const [filterVelocity, setFilterVelocity] = useState<FilterVelocity>('all');
    const [filterUrgency, setFilterUrgency] = useState<FilterUrgency>('all');
    const [filterMinInterest, setFilterMinInterest] = useState<number>(0);
    const [search, setSearch] = useState('');

    const fetchTrends = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: Record<string, any> = { limit: 100 };
            if (filterScore === '7+') params.min_score = 7;
            if (filterScore === '4+') params.min_score = 4;
            if (filterIP === 'safe') params.ip_safe = true;
            if (filterSource !== 'all') params.source = filterSource;

            const data = await api.getTrends(params);
            setTrends(data);
        } catch (e) {
            setError('Backend not reachable. Start the Docker stack first.');
        } finally {
            setLoading(false);
        }
    }, [filterScore, filterIP, filterSource]);

    useEffect(() => {
        fetchTrends();
    }, [fetchTrends]);

    const handleScrape = () => {
        if (scraping) return;
        setScraping(true);
        setScrapeProgress(0);
        setScrapeStatus('Connecting to scraper...');
        setError(null);

        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const eventSource = new EventSource(`${API_BASE} /trends/scrape`);

        eventSource.addEventListener('progress', (e) => {
            try {
                const data = JSON.parse(e.data);
                setScrapeStatus(data.status);
                setScrapeProgress(data.progress);
            } catch (err) {
                console.error("Failed to parse progress event:", err);
            }
        });

        eventSource.addEventListener('complete', (e) => {
            setScrapeStatus('Complete!');
            setScrapeProgress(100);
            eventSource.close();
            // Wait briefly before refreshing feeds
            setTimeout(() => {
                setScraping(false);
                fetchTrends();
            }, 1000);
        });

        eventSource.addEventListener('error', (e: any) => {
            let errorMsg = 'Scraping failed or connection lost.';
            if (e.data) {
                try {
                    const data = JSON.parse(e.data);
                    errorMsg = data.status || errorMsg;
                } catch { }
            }
            setError(errorMsg);
            setScraping(false);
            eventSource.close();
        });
    };

    const filtered = trends.filter((t) => {
        const matchSearch = !search || t.keyword.toLowerCase().includes(search.toLowerCase());
        const matchComp = filterComp === 'all' || t.competition_level === filterComp;
        const matchVelocity = filterVelocity === 'all' || t.trend_velocity === filterVelocity;
        const matchUrgency = filterUrgency === 'all' || t.urgency === filterUrgency;
        const matchInterest = t.avg_interest === null || t.avg_interest === undefined || t.avg_interest >= filterMinInterest;
        return matchSearch && matchComp && matchVelocity && matchUrgency && matchInterest;
    });

    const highScore = filtered.filter((t) => (t.score_groq ?? 0) >= 7).length;
    const [showCostDashboard, setShowCostDashboard] = useState(false);

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.title}>Trend Feed</h1>
                    <p className={styles.subtitle}>
                        {trends.length} trends tracked · <span className={styles.highlight}>{highScore} high-value</span>
                    </p>
                </div>
                <div className={styles.actions}>
                    <button
                        className={styles.secondaryBtn}
                        onClick={() => setShowCostDashboard(!showCostDashboard)}
                    >
                        {showCostDashboard ? '📊 Hide Stats' : '💰 Cost Stats'}
                    </button>
                    <button
                        className={styles.scrapeBtn}
                        onClick={handleScrape}
                        disabled={scraping}
                        id="scrape-btn"
                    >
                        {scraping ? 'Scraping in progress...' : '⟳ Run Scraper'}
                    </button>
                </div>
            </div>

            {showCostDashboard && <CostDashboard trends={trends} />}

            {scraping && (
                <div className={styles.progressContainer}>
                    <div className={styles.progressHeader}>
                        <span className={styles.progressStatus}>{scrapeStatus}</span>
                        <span className={styles.progressPercent}>{scrapeProgress}%</span>
                    </div>
                    <div className={styles.progressBarBg}>
                        <div
                            className={styles.progressBarFill}
                            style={{ width: `${scrapeProgress}% ` }}
                        />
                    </div>
                </div>
            )}

            <div className={styles.filters}>
                <input
                    className={styles.search}
                    placeholder="Search keywords..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    id="search-input"
                />

                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Source</span>
                    {(['all', 'google', 'tiktok', 'pinterest', 'redbubble', 'etsy'] as FilterSource[]).map((v) => (
                        <button
                            key={v}
                            className={`${styles.pill} ${filterSource === v ? styles.active : ''} `}
                            onClick={() => setFilterSource(v)}
                        >
                            {v === 'all' ? 'All' : v}
                        </button>
                    ))}
                </div>

                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Score</span>
                    {(['all', '4+', '7+'] as FilterScore[]).map((v) => (
                        <button
                            key={v}
                            className={`${styles.pill} ${filterScore === v ? styles.active : ''} `}
                            onClick={() => setFilterScore(v)}
                        >
                            {v}
                        </button>
                    ))}
                </div>

                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>IP</span>
                    {(['all', 'safe'] as FilterIP[]).map((v) => (
                        <button
                            key={v}
                            className={`${styles.pill} ${filterIP === v ? styles.active : ''} `}
                            onClick={() => setFilterIP(v)}
                        >
                            {v === 'all' ? 'All' : 'Safe'}
                        </button>
                    ))}
                </div>

                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Comp</span>
                    {['all', 'low', 'medium', 'high'].map((v) => (
                        <button
                            key={v}
                            className={`${styles.pill} ${filterComp === v ? styles.active : ''} `}
                            onClick={() => setFilterComp(v)}
                        >
                            {v}
                        </button>
                    ))}
                </div>

                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Momentum</span>
                    {(['all', 'rising', 'stable', 'declining'] as FilterVelocity[]).map((v) => (
                        <button
                            key={v}
                            className={`${styles.pill} ${filterVelocity === v ? styles.active : ''} `}
                            onClick={() => setFilterVelocity(v)}
                        >
                            {v === 'rising' ? '🚀 Rising' : v === 'declining' ? '📉 Declining' : v === 'stable' ? '📊 Stable' : 'All'}
                        </button>
                    ))}
                </div>

                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Urgency</span>
                    {(['all', 'urgent', 'plan_ahead', 'evergreen'] as FilterUrgency[]).map((v) => (
                        <button
                            key={v}
                            className={`${styles.pill} ${filterUrgency === v ? styles.active : ''} `}
                            onClick={() => setFilterUrgency(v)}
                        >
                            {v === 'urgent' ? '⚡ Urgent' : v === 'plan_ahead' ? '📅 Plan' : v === 'evergreen' ? '♻️ Evergreen' : 'All'}
                        </button>
                    ))}
                </div>

                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Interest</span>
                    {[0, 30, 50, 70].map((v) => (
                        <button
                            key={v}
                            className={`${styles.pill} ${filterMinInterest === v ? styles.active : ''} `}
                            onClick={() => setFilterMinInterest(v)}
                        >
                            {v === 0 ? 'All' : `${v} +`}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {loading && (
                <div className={styles.emptyState}>
                    <div className={styles.bigSpinner} />
                    <p>Loading trends...</p>
                </div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <div className={styles.emptyState}>
                    <p className={styles.emptyIcon}>📡</p>
                    <p className={styles.emptyTitle}>No trends yet</p>
                    <p className={styles.emptySubtitle}>Click Run Scraper to fetch trending keywords</p>
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <div className={styles.grid}>
                    {filtered.map((trend) => (
                        <TrendCard
                            key={trend.id}
                            trend={trend}
                            onGenerateDesign={() => {
                                if (onNavigate) onNavigate('explorer', trend.keyword);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
