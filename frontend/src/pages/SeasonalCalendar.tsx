import { useState, useMemo, useEffect } from 'react';
import { api } from '../api';
import styles from './SeasonalCalendar.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalendarEvent {
    id: string;
    name: string;
    emoji: string;
    date: string;         // MM-DD format (fixed) or YYYY-MM-DD (specific year)
    category: string;     // Holidays, Sports, Awareness, Lifestyle, Seasonal
    niches: string[];     // Suggested search terms for Niche Explorer
    leadDays: number;     // Days before event to start designing/listing
    color: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';
    notes?: string;
}

interface Props {
    onNavigateToExplorer?: (keyword: string) => void;
}

const CATEGORIES = ['All', 'Holiday', 'Awareness', 'Sports', 'Lifestyle', 'Seasonal'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getNextDate(mmdd: string): Date {
    const [mm, dd] = mmdd.split('-').map(Number);
    const now = new Date();
    let year = now.getFullYear();
    const candidate = new Date(year, mm - 1, dd);
    if (candidate < now) candidate.setFullYear(year + 1);
    return candidate;
}

function daysUntil(date: Date): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}

function urgencyClass(days: number, forAccent = false): string {
    if (days <= 14) return forAccent ? styles.accentRed : styles.chipRed;
    if (days <= 30) return forAccent ? styles.accentOrange : styles.chipOrange;
    if (days <= 60) return forAccent ? styles.accentYellow : styles.chipYellow;
    return forAccent ? styles.accentGreen : styles.chipGreen;
}

function colorToAccent(c: CalendarEvent['color']): string {
    const map: Record<string, string> = {
        red: styles.accentRed, orange: styles.accentOrange, yellow: styles.accentYellow,
        green: styles.accentGreen, blue: styles.accentBlue, purple: styles.accentPurple,
        pink: styles.accentPink,
    };
    return map[c] || styles.accentBlue;
}

function formatDate(d: Date): string {
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SeasonalCalendar({ onNavigateToExplorer }: Props) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState('');

    useEffect(() => {
        api.getCalendar().then(setEvents).finally(() => setLoading(false));
    }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2200);
    };

    // Compute dates + sort once
    const enriched = useMemo(() => {
        return events.map(ev => {
            const date = getNextDate(ev.date);
            const days = daysUntil(date);
            return { ...ev, resolvedDate: date, days };
        }).sort((a, b) => a.days - b.days);
    }, [events]);

    // Filter
    const filtered = useMemo(() => {
        return enriched.filter(ev => {
            const matchCat = category === 'All' || ev.category === category;
            const q = search.toLowerCase();
            const matchSearch = !q || ev.name.toLowerCase().includes(q) ||
                ev.niches.some(n => n.toLowerCase().includes(q)) ||
                ev.category.toLowerCase().includes(q);
            return matchCat && matchSearch;
        });
    }, [enriched, category, search]);

    // Group by month
    const byMonth = useMemo(() => {
        const groups: Record<string, typeof filtered> = {};
        for (const ev of filtered) {
            const key = ev.resolvedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(ev);
        }
        return Object.entries(groups);
    }, [filtered]);

    // Urgency counts for strip
    const urgencyCounts = useMemo(() => ({
        fire: enriched.filter(e => e.days <= 14).length,
        soon: enriched.filter(e => e.days > 14 && e.days <= 30).length,
        plan: enriched.filter(e => e.days > 30 && e.days <= 60).length,
        ahead: enriched.filter(e => e.days > 60).length,
    }), [enriched]);

    const handleExplore = (niche: string) => {
        if (onNavigateToExplorer) {
            onNavigateToExplorer(niche);
        } else {
            navigator.clipboard.writeText(niche)
                .then(() => showToast(`Copied "${niche}" — paste into Niche Explorer!`))
                .catch(() => showToast(`Search for: "${niche}"`));
        }
    };

    const handleCopyAll = (ev: typeof enriched[0]) => {
        const text = ev.niches.join(', ');
        navigator.clipboard.writeText(text).then(() => showToast(`${ev.niches.length} niches copied!`));
    };

    return (
        <div className={styles.page}>
            {loading && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.skeletonStrip}></div>
                    <div className={styles.skeletonGrid}>
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className={styles.skeletonCard}></div>)}
                    </div>
                </div>
            )}
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div className={styles.titleBlock}>
                        <h1>📅 Seasonal Design Calendar</h1>
                        <p>Plan your POD design drops — upcoming holidays, events & trending moments</p>
                    </div>
                </div>

                {/* Urgency strip */}
                <div className={styles.urgencyStrip}>
                    <span className={`${styles.urgencyPill} ${styles.urgencyRed}`}>
                        🔥 {urgencyCounts.fire} within 14 days
                    </span>
                    <span className={`${styles.urgencyPill} ${styles.urgencyOrange}`}>
                        ⚡ {urgencyCounts.soon} within 30 days
                    </span>
                    <span className={`${styles.urgencyPill} ${styles.urgencyYellow}`}>
                        📌 {urgencyCounts.plan} within 60 days
                    </span>
                    <span className={`${styles.urgencyPill} ${styles.urgencyGreen}`}>
                        📅 {urgencyCounts.ahead} coming up
                    </span>
                </div>

                {/* Filters */}
                <div className={styles.filterRow}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`${styles.filterBtn} ${category === cat ? styles.filterBtnActive : ''}`}
                            onClick={() => setCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                    <input
                        className={styles.searchInput}
                        placeholder="Search events or niches…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Body */}
            <div className={styles.body}>
                {byMonth.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyIcon}>📅</span>
                        <p>No events match your filters</p>
                    </div>
                ) : (
                    byMonth.map(([month, events]) => (
                        <div key={month} className={styles.monthSection}>
                            <p className={styles.monthLabel}>{month}</p>
                            <div className={styles.eventGrid}>
                                {events.map(ev => (
                                    <div
                                        key={ev.id}
                                        className={`${styles.eventCard} ${colorToAccent(ev.color)}`}
                                        id={`event-${ev.id}`}
                                    >
                                        {/* Header row */}
                                        <div className={styles.cardHeader}>
                                            <span className={styles.eventEmoji}>{ev.emoji}</span>
                                            <div className={styles.eventMeta}>
                                                <p className={styles.eventName}>{ev.name}</p>
                                                <p className={styles.eventDate}>{formatDate(ev.resolvedDate)}</p>
                                            </div>
                                            <span className={`${styles.daysChip} ${urgencyClass(ev.days)}`}>
                                                {ev.days === 0 ? 'Today!' : ev.days === 1 ? 'Tomorrow' : `${ev.days}d`}
                                            </span>
                                        </div>

                                        {/* Niche pills */}
                                        <div className={styles.nichePills}>
                                            {ev.niches.map(niche => (
                                                <button
                                                    key={niche}
                                                    className={styles.nichePill}
                                                    onClick={() => handleExplore(niche)}
                                                    title="Click to explore this niche"
                                                >
                                                    {niche}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Lead time */}
                                        <p className={styles.leadTime}>
                                            ⏱ Start designing <strong>{ev.leadDays}+ days</strong> before
                                            {ev.days <= ev.leadDays && (
                                                <span style={{ color: '#f87171', marginLeft: 4 }}>— start now!</span>
                                            )}
                                        </p>

                                        {/* Notes */}
                                        {ev.notes && (
                                            <p style={{ fontSize: '0.72rem', color: '#4b5563', margin: 0 }}>
                                                💡 {ev.notes}
                                            </p>
                                        )}

                                        {/* Actions */}
                                        <div className={styles.cardActions}>
                                            <button
                                                className={styles.btnPrimary}
                                                onClick={() => handleExplore(ev.niches[0])}
                                                id={`explore-${ev.id}`}
                                            >
                                                🔍 Explore Top Niche
                                            </button>
                                            <button
                                                className={styles.btnSecondary}
                                                onClick={() => handleCopyAll(ev)}
                                                title="Copy all niches to clipboard"
                                            >
                                                📋
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Toast */}
            {toast && <div className={styles.toast}>📋 {toast}</div>}
        </div>
    );
}
