import { useState, useEffect, useCallback } from 'react';
import { Trend } from '../types';
import { TrendCard } from '../components/TrendCard';
import { api } from '../api';
import styles from './TrendFeed.module.css';

type FilterScore = 'all' | '7+' | '4+';
type FilterIP = 'all' | 'safe';
type FilterSource = 'all' | 'google' | 'tiktok' | 'pinterest' | 'redbubble' | 'etsy';

export function TrendFeed() {
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
        const eventSource = new EventSource(`${API_BASE}/trends/scrape`);

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
        return matchSearch && matchComp;
    });

    const highScore = filtered.filter((t) => (t.score_groq ?? 0) >= 7).length;

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.title}>Trend Feed</h1>
                    <p className={styles.subtitle}>
                        {trends.length} trends tracked · <span className={styles.highlight}>{highScore} high-value</span>
                    </p>
                </div>
                <button
                    className={styles.scrapeBtn}
                    onClick={handleScrape}
                    disabled={scraping}
                    id="scrape-btn"
                >
                    {scraping ? 'Scraping in progress...' : '⟳ Run Scraper'}
                </button>
            </div>

            {scraping && (
                <div className={styles.progressContainer}>
                    <div className={styles.progressHeader}>
                        <span className={styles.progressStatus}>{scrapeStatus}</span>
                        <span className={styles.progressPercent}>{scrapeProgress}%</span>
                    </div>
                    <div className={styles.progressBarBg}>
                        <div
                            className={styles.progressBarFill}
                            style={{ width: `${scrapeProgress}%` }}
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
                            className={`${styles.pill} ${filterSource === v ? styles.active : ''}`}
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
                            className={`${styles.pill} ${filterScore === v ? styles.active : ''}`}
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
                            className={`${styles.pill} ${filterIP === v ? styles.active : ''}`}
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
                            className={`${styles.pill} ${filterComp === v ? styles.active : ''}`}
                            onClick={() => setFilterComp(v)}
                        >
                            {v}
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
                        <TrendCard key={trend.id} trend={trend} />
                    ))}
                </div>
            )}
        </div>
    );
}
