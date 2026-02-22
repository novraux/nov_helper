import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import styles from './DesignVault.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SavedDesign {
    id: number;
    niche: string;
    title: string;
    concept?: string;
    design_text?: string;
    product_type?: string;
    style_preference?: string;
    demand_score?: number;
    elements?: string[];
    mockup_url?: string;
    listing_title?: string;
    listing_description?: string;
    listing_tags?: string[];
    status: 'draft' | 'ready' | 'exported';
    created_at?: string;
}

interface VaultStats {
    total: number;
    by_status: Record<string, number>;
    top_niches: { niche: string; count: number }[];
}

// Gradient palettes for mockup placeholders
const GRADIENTS = [
    'linear-gradient(135deg, #1e1333 0%, #3b1d8a 100%)',
    'linear-gradient(135deg, #0d2137 0%, #0a5c7e 100%)',
    'linear-gradient(135deg, #1a0e2e 0%, #6d28d9 100%)',
    'linear-gradient(135deg, #0e1f1c 0%, #065f46 100%)',
    'linear-gradient(135deg, #1c0e1a 0%, #7c2d82 100%)',
    'linear-gradient(135deg, #1a1500 0%, #7d5b00 100%)',
];

const PRODUCT_EMOJI: Record<string, string> = {
    't-shirt': '👕',
    tshirt: '👕',
    hoodie: '🧥',
    mug: '☕',
    poster: '🖼️',
    sticker: '🏷️',
    cap: '🧢',
    default: '🎨',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function DesignVault() {
    const [designs, setDesigns] = useState<SavedDesign[]>([]);
    const [stats, setStats] = useState<VaultStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null);

    // Filters
    const [filterNiche, setFilterNiche] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterStyle, setFilterStyle] = useState('');

    // Expanded listing panels
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    // ── Data fetching ─────────────────────────────────────────────────────────

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [v, s] = await Promise.all([
                api.getVaultDesigns({
                    niche: filterNiche || undefined,
                    status: filterStatus || undefined,
                    style: filterStyle || undefined,
                }),
                api.getVaultStats(),
            ]);
            setDesigns(v);
            setStats(s);
        } catch (e) {
            showToast('Failed to load vault', '⚠️');
        } finally {
            setLoading(false);
        }
    }, [filterNiche, filterStatus, filterStyle]);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Toast helper ──────────────────────────────────────────────────────────

    const showToast = (msg: string, icon = '✓') => {
        setToast({ msg, icon });
        setTimeout(() => setToast(null), 2800);
    };

    // ── Actions ───────────────────────────────────────────────────────────────

    const handleStatusCycle = async (design: SavedDesign) => {
        const next: Record<string, 'draft' | 'ready' | 'exported'> = {
            draft: 'ready',
            ready: 'exported',
            exported: 'draft',
        };
        try {
            const updated = await api.updateDesignStatus(design.id, next[design.status]);
            setDesigns(prev => prev.map(d => d.id === design.id ? { ...d, status: updated.status } : d));
            showToast(`Marked as ${updated.status}`, '✓');
        } catch {
            showToast('Failed to update status', '✗');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.deleteDesign(id);
            setDesigns(prev => prev.filter(d => d.id !== id));
            if (stats) setStats({ ...stats, total: stats.total - 1 });
            showToast('Design removed from vault', '🗑');
        } catch {
            showToast('Failed to delete', '✗');
        }
    };

    const handleCopyListing = (design: SavedDesign) => {
        if (!design.listing_title) {
            showToast('No listing copy yet — generate from Niche Explorer', '⚠️');
            return;
        }
        const text = [
            `TITLE: ${design.listing_title}`,
            '',
            `DESCRIPTION:\n${design.listing_description || ''}`,
            '',
            `TAGS: ${(design.listing_tags || []).join(', ')}`,
        ].join('\n');
        navigator.clipboard.writeText(text).then(() => showToast('Listing copy copied!', '📋'));
    };

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    const getGradient = (id: number) => GRADIENTS[id % GRADIENTS.length];

    const getProductEmoji = (type?: string) => {
        if (!type) return PRODUCT_EMOJI.default;
        const key = type.toLowerCase().replace(/\s/g, '');
        return PRODUCT_EMOJI[key] || PRODUCT_EMOJI.default;
    };

    const getScoreClass = (score?: number) => {
        if (!score) return '';
        if (score >= 8) return styles.scoreHigh;
        if (score >= 5) return styles.scoreMid;
        return styles.scoreLow;
    };

    const getStatusClass = (status: string) => {
        if (status === 'ready') return styles.statusReady;
        if (status === 'exported') return styles.statusExported;
        return styles.statusDraft;
    };

    const nextStatusLabel = (status: string) => {
        if (status === 'draft') return '✓ Mark Ready';
        if (status === 'ready') return '🚀 Mark Exported';
        return '↩ Reset';
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <div className={styles.titleBlock}>
                        <h1>🗂 Design Vault</h1>
                        <p>Your saved AI-generated design ideas — track, refine &amp; export to Etsy</p>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className={styles.stats}>
                        <div className={styles.statPill}>
                            Total <strong>{stats.total}</strong>
                        </div>
                        {Object.entries(stats.by_status).map(([s, n]) => (
                            <div key={s} className={styles.statPill}>
                                {s} <strong>{n}</strong>
                            </div>
                        ))}
                        {stats.top_niches.slice(0, 3).map(n => (
                            <div key={n.niche} className={styles.statPill}>
                                🏷 {n.niche} <strong>{n.count}</strong>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filters */}
                <div className={styles.filters}>
                    <input
                        className={styles.filterInput}
                        placeholder="Filter by niche…"
                        value={filterNiche}
                        onChange={e => setFilterNiche(e.target.value)}
                        id="vault-filter-niche"
                    />
                    <select
                        className={styles.filterSelect}
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        id="vault-filter-status"
                    >
                        <option value="">All statuses</option>
                        <option value="draft">Draft</option>
                        <option value="ready">Ready</option>
                        <option value="exported">Exported</option>
                    </select>
                    <select
                        className={styles.filterSelect}
                        value={filterStyle}
                        onChange={e => setFilterStyle(e.target.value)}
                        id="vault-filter-style"
                    >
                        <option value="">All styles</option>
                        <option value="Text-Only">Text-Only</option>
                        <option value="Graphic-Heavy">Graphic-Heavy</option>
                        <option value="Balanced">Balanced</option>
                    </select>
                    <button className={styles.refreshBtn} onClick={loadData} id="vault-refresh-btn">
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* Design grid */}
            <div className={styles.grid}>
                {loading ? (
                    <div className={styles.loading}>Loading your vault…</div>
                ) : designs.length === 0 ? (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>🗂</div>
                        <h3>Your vault is empty</h3>
                        <p>
                            Go to <strong>Niche Explorer</strong>, search a niche, and click
                            <strong> "Save to Vault"</strong> on any design card.
                        </p>
                    </div>
                ) : (
                    designs.map(design => (
                        <div key={design.id} className={styles.card}>
                            {/* Mockup */}
                            <div className={styles.mockup} style={{ background: getGradient(design.id) }}>
                                {design.mockup_url ? (
                                    <img src={design.mockup_url} alt={design.title} className={styles.mockupImg} />
                                ) : (
                                    <div className={styles.mockupPlaceholder}>
                                        {getProductEmoji(design.product_type)}
                                    </div>
                                )}
                                <span className={`${styles.statusBadge} ${getStatusClass(design.status)}`}>
                                    {design.status}
                                </span>
                            </div>

                            {/* Body */}
                            <div className={styles.cardBody}>
                                <div className={styles.cardMeta}>
                                    <span className={styles.nicheBadge}>{design.niche}</span>
                                    {design.product_type && (
                                        <span className={styles.productChip}>{design.product_type}</span>
                                    )}
                                    {design.demand_score != null && (
                                        <span className={`${styles.scoreChip} ${getScoreClass(design.demand_score)}`}>
                                            {design.demand_score}/10
                                        </span>
                                    )}
                                </div>

                                <p className={styles.cardTitle}>{design.title}</p>

                                {design.design_text && (
                                    <p className={styles.cardQuote}>"{design.design_text}"</p>
                                )}
                            </div>

                            {/* Listing panel (expanded) */}
                            {expandedIds.has(design.id) && design.listing_title && (
                                <div className={styles.listingPanel}>
                                    <span className={styles.listingLabel}>Listing Title</span>
                                    <span className={styles.listingValue}>{design.listing_title}</span>
                                    {design.listing_tags && design.listing_tags.length > 0 && (
                                        <>
                                            <span className={styles.listingLabel}>Tags</span>
                                            <div className={styles.tags}>
                                                {design.listing_tags.slice(0, 8).map(t => (
                                                    <span key={t} className={styles.tag}>{t}</span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                    <button
                                        className={styles.copyBtn}
                                        onClick={() => handleCopyListing(design)}
                                    >
                                        📋 Copy all
                                    </button>
                                </div>
                            )}

                            {/* Actions */}
                            <div className={styles.actions}>
                                <button
                                    className={`${styles.btn} ${styles.btnSecondary}`}
                                    onClick={() => toggleExpand(design.id)}
                                    id={`vault-listing-${design.id}`}
                                    title="View listing copy"
                                >
                                    📝 {expandedIds.has(design.id) ? 'Hide' : 'Listing'}
                                </button>
                                <button
                                    className={`${styles.btn} ${styles.btnSecondary}`}
                                    onClick={() => handleCopyListing(design)}
                                    id={`vault-copy-${design.id}`}
                                    title="Copy listing copy to clipboard"
                                >
                                    📋 Copy
                                </button>
                                <button
                                    className={`${styles.btn} ${styles.btnSuccess}`}
                                    onClick={() => handleStatusCycle(design)}
                                    id={`vault-status-${design.id}`}
                                >
                                    {nextStatusLabel(design.status)}
                                </button>
                                <button
                                    className={`${styles.btn} ${styles.btnDanger}`}
                                    onClick={() => handleDelete(design.id)}
                                    id={`vault-delete-${design.id}`}
                                    title="Delete design"
                                >
                                    🗑
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Toast */}
            {toast && (
                <div className={styles.toast}>
                    <span>{toast.icon}</span>
                    {toast.msg}
                </div>
            )}
        </div>
    );
}
