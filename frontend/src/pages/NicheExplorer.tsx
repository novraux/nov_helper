import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import styles from './NicheExplorer.module.css';

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Competitor {
    title: string;
    price: string;
    url?: string;
    platform?: string;
}
interface DesignIdea {
    title: string;
    concept: string;
    elements: string[];
    product: string;
    demand_score: number;
    design_text: string;
}
interface ValidationResult {
    success: boolean;
    keyword: string;
    listing_count: number;
    price_stats?: { min: number; max: number; avg: number; median: number };
    market_gap_report: string;
    opportunity_score: number;
    platforms?: { etsy: number; redbubble: number };
    top_competitors?: Competitor[];
}
interface NichePODAnalysis {
    success: boolean;
    niche: string;
    validation: ValidationResult;
    competitor_count: number;
    gap_analysis: string;
    designs?: { success: boolean; designs: DesignIdea[]; niche: string; total: number };
    next_step: string;
}
interface DesignBrief { success: boolean; brief: any; niche: string; design_title: string }
interface ListingCopy { success: boolean; listing: any; niche: string; design_title: string }
interface DesignMockup { success: boolean; image_url: string; design_title: string; product_type: string; niche: string }
interface DesignVariation { product_type: string; image_url?: string; success: boolean; error?: string; fallback_url?: string }
interface DesignVariations { success: boolean; design_title: string; niche: string; variations: DesignVariation[]; total_generated: number }

interface Props { initialKeyword?: string }

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const STYLE_OPTIONS = [
    { key: 'Text-Only', icon: '✍️', desc: 'Typography-focused' },
    { key: 'Minimalist', icon: '◻️', desc: 'Clean & simple' },
    { key: 'Graphic-Heavy', icon: '🖼️', desc: 'Illustrated art' },
    { key: 'Vintage Retro', icon: '📼', desc: 'Nostalgic feel' },
    { key: 'Balanced', icon: '⚖️', desc: 'Text + graphic' },
];
const QUICK_TAGS = ['Stoicism', 'Camping', 'Cat Mom', 'Yoga', 'Mental Health', 'Motivational'];

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button className={styles.copyBtn} onClick={copy} title="Copy to clipboard">
            {copied ? '✅ Copied!' : '📋 Copy'}
        </button>
    );
}

function SkeletonBox({ height = 80 }: { height?: number }) {
    return <div className={styles.skeletonBox} style={{ height }} />;
}

function ScoreGauge({ score }: { score: number }) {
    const color = score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444';
    const label = score > 70 ? '✅ High Opportunity' : score > 40 ? '⚠️ Moderate' : '❌ Risky';
    const pct = Math.min(score, 100);
    return (
        <div className={styles.scoreGaugeWrap}>
            <div
                className={styles.scoreGauge}
                style={{ background: `conic-gradient(${color} ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)` }}
            >
                <div className={styles.scoreGaugeInner}>
                    <span className={styles.scoreVal}>{score}</span>
                    <span className={styles.scoreUnit}>/ 100</span>
                </div>
            </div>
            <span className={styles.scoreLabel} style={{ color }}>{label}</span>
        </div>
    );
}

/* ─── Component ─────────────────────────────────────────────────────────── */
export function NicheExplorer({ initialKeyword }: Props) {
    const [keyword, setKeyword] = useState(initialKeyword || '');
    const [stylePref, setStylePref] = useState('Balanced');
    const [loading, setLoading] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [designDetailsLoading, setDesignDetailsLoading] = useState(false);
    const [variationsLoading, setVariationsLoading] = useState(false);
    const [reportExpanded, setReportExpanded] = useState(false);

    const [result, setResult] = useState<ValidationResult | null>(null);
    const [podAnalysis, setPodAnalysis] = useState<NichePODAnalysis | null>(null);
    const [selectedDesign, setSelectedDesign] = useState<DesignIdea | null>(null);
    const [designBrief, setDesignBrief] = useState<DesignBrief | null>(null);
    const [listingCopy, setListingCopy] = useState<ListingCopy | null>(null);
    const [mockupImage, setMockupImage] = useState<DesignMockup | null>(null);
    const [designVariations, setDesignVariations] = useState<DesignVariations | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'search' | 'designs' | 'design-detail'>('search');

    const handleSearch = useCallback(async (e?: React.FormEvent | null, searchKw?: string) => {
        if (e) e.preventDefault();
        const kw = searchKw || keyword;
        if (!kw.trim()) return;
        setLoading(true);
        setError(null);
        setResult(null);
        setReportExpanded(false);
        try {
            const data = await api.exploreNiche(kw);
            setResult(data);
            setView('search');
        } catch (err: any) {
            setError(err.message || 'Something went wrong during exploration.');
        } finally {
            setLoading(false);
        }
    }, [keyword]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const nicheQuery = urlParams.get('niche');
        const startKeyword = initialKeyword || nicheQuery;
        if (startKeyword) {
            setKeyword(startKeyword);
            handleSearch(null, startKeyword);
        }
    }, [initialKeyword]);

    const handleAnalyzePOD = async (niche: string) => {
        setAnalysisLoading(true);
        setError(null);
        try {
            const data = await fetch(
                `http://localhost:8000/research/niche/analyze?niche=${encodeURIComponent(niche)}&generate_designs=true&style_preference=${encodeURIComponent(stylePref)}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' } }
            ).then(r => r.json());
            if (!data.success) { setError(data.error || 'Failed to analyze niche'); return; }
            setPodAnalysis(data);
            setSelectedDesign(null); setDesignBrief(null); setListingCopy(null);
            setMockupImage(null); setDesignVariations(null);
            setView('designs');
        } catch (err: any) {
            setError(err.message || 'Failed to analyze niche for POD');
        } finally {
            setAnalysisLoading(false);
        }
    };

    const handleSelectDesign = async (design: DesignIdea) => {
        setSelectedDesign(design);
        setDesignDetailsLoading(true);
        setError(null);
        setMockupImage(null);
        setDesignVariations(null);
        try {
            const [briefData, listingData] = await Promise.all([
                fetch(`http://localhost:8000/research/design/brief?niche=${encodeURIComponent(podAnalysis?.niche || '')}&design_title=${encodeURIComponent(design.title)}&design_concept=${encodeURIComponent(design.concept)}&style_preference=${encodeURIComponent(stylePref)}`,
                    { method: 'POST', headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
                fetch(`http://localhost:8000/research/design/listing?niche=${encodeURIComponent(podAnalysis?.niche || '')}&design_title=${encodeURIComponent(design.title)}&design_text=${encodeURIComponent(design.design_text)}`,
                    { method: 'POST', headers: { 'Content-Type': 'application/json' } }).then(r => r.json()),
            ]);
            setDesignBrief(briefData);
            setListingCopy(listingData);
            setView('design-detail');
        } catch (err: any) {
            setError(err.message || 'Failed to fetch design details');
        } finally {
            setDesignDetailsLoading(false);
        }
    };

    const handleGenerateMockup = async () => {
        if (!selectedDesign || !podAnalysis) return;
        setDesignDetailsLoading(true);
        setError(null);
        try {
            const data = await fetch(
                `http://localhost:8000/research/design/mockup?niche=${encodeURIComponent(podAnalysis.niche)}&design_title=${encodeURIComponent(selectedDesign.title)}&design_concept=${encodeURIComponent(selectedDesign.concept)}&design_text=${encodeURIComponent(selectedDesign.design_text)}&product_type=${encodeURIComponent(selectedDesign.product)}&style_preference=${encodeURIComponent(stylePref)}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' } }
            ).then(r => r.json());
            if (!data.success) throw new Error(data.error || 'Failed to generate graphic');
            setMockupImage(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDesignDetailsLoading(false);
        }
    };

    const handleGenerateVariations = async () => {
        if (!selectedDesign || !podAnalysis) return;
        setVariationsLoading(true);
        setError(null);
        try {
            const data = await fetch(
                `http://localhost:8000/research/design/variations?niche=${encodeURIComponent(podAnalysis.niche)}&design_title=${encodeURIComponent(selectedDesign.title)}&design_concept=${encodeURIComponent(selectedDesign.concept)}&num_variations=5&style_preference=${encodeURIComponent(stylePref)}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' } }
            ).then(r => r.json());
            setDesignVariations(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setVariationsLoading(false);
        }
    };

    const handleExportDesign = () => {
        if (!selectedDesign) return;
        const data = { design: selectedDesign, brief: designBrief?.brief, listing: listingCopy?.listing, mockup_url: mockupImage?.image_url };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${selectedDesign.title.toLowerCase().replace(/\s+/g, '-')}.json`; a.click();
        URL.revokeObjectURL(url);
    };

    /* ─── Brief helpers ─────────────────── */
    const BRIEF_LABELS: Record<string, string> = {
        color_palette: '🎨 Color Palette', typography: '✍️ Typography', style_notes: '📝 Style Notes',
        design_elements: '🔷 Design Elements', mood: '✨ Mood / Tone', technical_specs: '⚙️ Technical Specs',
    };

    /* ─── Render ─────────────────────────────────────────────────────────── */
    return (
        <div className={styles.container}>

            {/* ══════════ SEARCH VIEW ══════════ */}
            {view === 'search' && (
                <>
                    <header className={styles.hero}>
                        <div className={styles.heroText}>
                            <h1 className={styles.heroTitle}>🎨 Niche Explorer</h1>
                            <p className={styles.heroSub}>Discover profitable niches → generate on-brand designs → export to Printful</p>
                        </div>
                        <form className={styles.searchRow} onSubmit={handleSearch}>
                            <div className={styles.inputWrap}>
                                <span className={styles.inputIcon}>🔍</span>
                                <input
                                    type="text" value={keyword}
                                    onChange={e => setKeyword(e.target.value)}
                                    placeholder="e.g. stoicism, retro camping, cat mom..."
                                    className={styles.searchInput}
                                    disabled={loading}
                                />
                            </div>
                            <button type="submit" className={styles.searchBtn} disabled={loading}>
                                {loading ? <><span className={styles.btnSpinner} /> Analyzing…</> : 'Search Niche →'}
                            </button>
                        </form>
                        <div className={styles.quickTags}>
                            {QUICK_TAGS.map(tag => (
                                <button key={tag} className={styles.quickTag} onClick={() => { setKeyword(tag); handleSearch(null, tag); }}>
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </header>

                    {error && <div className={styles.errorCard}><span>⚠️</span><p>{error}</p></div>}

                    {loading && (
                        <div className={styles.loadingArea}>
                            <div className={styles.loadingDots}><span /><span /><span /></div>
                            <p>Scraping Etsy & Redbubble… Running AI market analysis…</p>
                        </div>
                    )}

                    {result && !loading && (
                        <div className={styles.resultsArea}>
                            {/* ── KPI Dashboard ── */}
                            <div className={styles.kpiGrid}>
                                <div className={styles.kpiScore}>
                                    <ScoreGauge score={result.opportunity_score} />
                                </div>
                                <div className={styles.kpiStats}>
                                    <div className={styles.kpiCard}>
                                        <span className={styles.kpiLabel}>Listings Found</span>
                                        <span className={styles.kpiValue}>{result.listing_count}</span>
                                        <span className={styles.kpiSub}>{result.platforms ? `Etsy ${result.platforms.etsy} · RB ${result.platforms.redbubble}` : 'Cross-platform'}</span>
                                    </div>
                                    {result.price_stats && <>
                                        <div className={styles.kpiCard}>
                                            <span className={styles.kpiLabel}>Avg Price</span>
                                            <span className={styles.kpiValue}>${result.price_stats.avg.toFixed(2)}</span>
                                            <span className={styles.kpiSub}>Median ${result.price_stats.median?.toFixed(2) ?? '—'}</span>
                                        </div>
                                        <div className={styles.kpiCard}>
                                            <span className={styles.kpiLabel}>Price Range</span>
                                            <span className={styles.kpiValue}>${result.price_stats.min} – ${result.price_stats.max}</span>
                                            <span className={styles.kpiSub}>Min to Max</span>
                                        </div>
                                    </>}
                                </div>
                            </div>

                            {/* ── Market Report Accordion ── */}
                            <div className={styles.reportCard}>
                                <div className={styles.reportCardHeader} onClick={() => setReportExpanded(v => !v)}>
                                    <h2 className={styles.reportCardTitle}>📊 Market Analysis</h2>
                                    <span className={styles.accordionIcon}>{reportExpanded ? '▲' : '▼'}</span>
                                </div>
                                <div className={`${styles.reportBody} ${reportExpanded ? styles.reportBodyOpen : ''}`}>
                                    <div className={styles.reportContent}>
                                        <ReactMarkdown>{result.market_gap_report}</ReactMarkdown>
                                    </div>
                                </div>
                                {!reportExpanded && (
                                    <div className={styles.reportPreview}>
                                        {result.market_gap_report.split('\n').filter(l => l.trim()).slice(0, 2).join(' ')}
                                        <span className={styles.readMore} onClick={() => setReportExpanded(true)}> … Read full analysis ▼</span>
                                    </div>
                                )}
                            </div>

                            {/* ── Style Picker + CTA ── */}
                            <div className={styles.styleSection}>
                                <div className={styles.styleSectionHeader}>
                                    <h2 className={styles.styleSectionTitle}>🎨 Pick a Design Style</h2>
                                    <p className={styles.styleSectionSub}>Choose the visual direction before generating ideas</p>
                                </div>
                                <div className={styles.stylePills}>
                                    {STYLE_OPTIONS.map(s => (
                                        <button key={s.key} className={`${styles.stylePill} ${stylePref === s.key ? styles.stylePillActive : ''}`}
                                            onClick={() => setStylePref(s.key)}>
                                            <span className={styles.pillIcon}>{s.icon}</span>
                                            <span className={styles.pillKey}>{s.key}</span>
                                            <span className={styles.pillDesc}>{s.desc}</span>
                                        </button>
                                    ))}
                                </div>
                                <button className={styles.ctaBtn} onClick={() => handleAnalyzePOD(result.keyword)} disabled={analysisLoading}>
                                    {analysisLoading
                                        ? <><span className={styles.btnSpinner} /> Generating Ideas…</>
                                        : `✨ Generate ${stylePref} Designs for "${result.keyword}"`}
                                </button>
                            </div>

                            {/* ── Competitors ── */}
                            {result.top_competitors && result.top_competitors.length > 0 && (
                                <div className={styles.compSection}>
                                    <h2 className={styles.sectionHeading}>🏆 Top Competitor Listings</h2>
                                    <div className={styles.compGrid}>
                                        {result.top_competitors.map((comp, i) => (
                                            <a key={i} href={comp.url} target="_blank" rel="noopener noreferrer" className={styles.compCard}>
                                                <div className={styles.compCardTop}>
                                                    <span className={`${styles.platformBadge} ${styles[`platform_${comp.platform || 'etsy'}`]}`}>
                                                        {comp.platform || 'etsy'}
                                                    </span>
                                                    <span className={styles.compPrice}>${comp.price}</span>
                                                </div>
                                                <p className={styles.compTitle}>{comp.title}</p>
                                                <span className={styles.viewListingLink}>View Listing ↗</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ══════════ DESIGNS GRID VIEW ══════════ */}
            {view === 'designs' && podAnalysis && (
                <div className={styles.designsView}>
                    <div className={styles.subNav}>
                        <button className={styles.backBtn} onClick={() => setView('search')}>← Back to Search</button>
                        <div className={styles.breadcrumb}>
                            <span className={styles.breadcrumbItem} onClick={() => setView('search')}>Search</span>
                            <span className={styles.breadcrumbSep}>›</span>
                            <span className={styles.breadcrumbActive}>Design Ideas</span>
                        </div>
                    </div>

                    <div className={styles.designsHeader}>
                        <h2 className={styles.designsTitle}>🎨 Design Ideas for <em>"{podAnalysis.niche}"</em></h2>
                        <p className={styles.designsSub}>Click any card to generate a full brief, Etsy listing copy & raw design PNG</p>
                    </div>

                    {error && <div className={styles.errorCard}><span>⚠️</span><p>{error}</p></div>}

                    {podAnalysis.designs?.success && (
                        <div className={styles.designGrid}>
                            {podAnalysis.designs.designs.map((design, i) => {
                                const hue = (i * 47 + 200) % 360;
                                return (
                                    <div key={i} className={styles.designCard} onClick={() => handleSelectDesign(design)}>
                                        <div className={styles.designCardThumb} style={{ background: `linear-gradient(135deg, hsl(${hue},50%,25%), hsl(${hue + 40},50%,12%))` }}>
                                            <div className={styles.thumbContent}>
                                                <span className={styles.thumbNum}>#{i + 1}</span>
                                                <span className={styles.thumbProduct}>{design.product}</span>
                                            </div>
                                        </div>
                                        <div className={styles.designCardBody}>
                                            <div className={styles.demandRow}>
                                                <div className={styles.demandBarWrap}>
                                                    <div className={styles.demandBar} style={{ width: `${design.demand_score * 10}%` }} />
                                                </div>
                                                <span className={styles.demandNum}>{design.demand_score}/10</span>
                                            </div>
                                            <h3 className={styles.designCardTitle}>{design.title}</h3>
                                            <p className={styles.designCardConcept}>{design.concept}</p>
                                            <div className={styles.elementChips}>
                                                {design.elements.slice(0, 4).map((el, j) => (
                                                    <span key={j} className={styles.elementChip}>{el}</span>
                                                ))}
                                            </div>
                                            <div className={styles.designCardCta}>View Details & Generate Copy →</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════ DESIGN DETAIL VIEW ══════════ */}
            {view === 'design-detail' && selectedDesign && podAnalysis && (
                <div className={styles.detailView}>
                    <div className={styles.subNav}>
                        <button className={styles.backBtn} onClick={() => setView('designs')}>← Back to Designs</button>
                        <div className={styles.breadcrumb}>
                            <span className={styles.breadcrumbItem} onClick={() => setView('search')}>Search</span>
                            <span className={styles.breadcrumbSep}>›</span>
                            <span className={styles.breadcrumbItem} onClick={() => setView('designs')}>Design Ideas</span>
                            <span className={styles.breadcrumbSep}>›</span>
                            <span className={styles.breadcrumbActive}>{selectedDesign.title}</span>
                        </div>
                    </div>

                    {error && <div className={styles.errorCard}><span>⚠️</span><p>{error}</p></div>}

                    <div className={styles.detailLayout}>
                        {/* Left column */}
                        <div className={styles.detailLeft}>
                            {/* Overview card */}
                            <div className={styles.overviewCard}>
                                <h2 className={styles.overviewTitle}>{selectedDesign.title}</h2>
                                <p className={styles.overviewConcept}>{selectedDesign.concept}</p>
                                <div className={styles.overviewMeta}>
                                    <span className={styles.productBadge}>{selectedDesign.product}</span>
                                    <span className={styles.demandLabel}>Demand {selectedDesign.demand_score}/10</span>
                                </div>
                                {selectedDesign.design_text && (
                                    <div className={styles.designTextBlock}>
                                        <div className={styles.fieldHeader}>
                                            <strong>Design Text</strong>
                                            <CopyButton text={selectedDesign.design_text} />
                                        </div>
                                        <p className={styles.designTextValue}>"{selectedDesign.design_text}"</p>
                                    </div>
                                )}
                                <div className={styles.elementChips} style={{ marginTop: '12px' }}>
                                    {selectedDesign.elements.map((el, i) => <span key={i} className={styles.elementChip}>{el}</span>)}
                                </div>
                            </div>

                            {/* Design Brief */}
                            <div className={styles.detailSection}>
                                <h3 className={styles.detailSectionTitle}>🎨 Design Brief</h3>
                                {designDetailsLoading && !designBrief
                                    ? <><SkeletonBox height={60} /><SkeletonBox height={60} /><SkeletonBox height={60} /></>
                                    : designBrief?.success
                                        ? Object.entries(designBrief.brief).map(([key, value]) => (
                                            <div key={key} className={styles.briefRow}>
                                                <div className={styles.briefRowHeader}>
                                                    <span className={styles.briefKey}>{BRIEF_LABELS[key] || key.replace(/_/g, ' ')}</span>
                                                    <CopyButton text={typeof value === 'object' ? JSON.stringify(value) : String(value)} />
                                                </div>
                                                <div className={styles.briefValue}>
                                                    {typeof value === 'object'
                                                        ? Array.isArray(value)
                                                            ? <div className={styles.elementChips}>{(value as string[]).map((v, i) => <span key={i} className={styles.elementChip}>{v}</span>)}</div>
                                                            : <pre>{JSON.stringify(value, null, 2)}</pre>
                                                        : String(value)}
                                                </div>
                                            </div>
                                        ))
                                        : <p className={styles.emptyState}>Brief will appear here after loading.</p>}
                            </div>
                        </div>

                        {/* Right column */}
                        <div className={styles.detailRight}>
                            {/* DALL-E PNG Section */}
                            <div className={styles.detailSection}>
                                <h3 className={styles.detailSectionTitle}>🖼️ Raw Design Graphic</h3>
                                {mockupImage?.success ? (
                                    <div className={styles.imageResult}>
                                        <img src={mockupImage.image_url} alt="Generated Design" className={styles.generatedImg} />
                                        <div className={styles.imageActions}>
                                            <a href={mockupImage.image_url} download={`${selectedDesign.title}.png`} className={styles.downloadBtn} target="_blank" rel="noopener noreferrer">
                                                📥 Download PNG
                                            </a>
                                            <button className={styles.regenBtn} onClick={handleGenerateMockup} disabled={designDetailsLoading}>
                                                🔄 Regenerate
                                            </button>
                                        </div>
                                    </div>
                                ) : designDetailsLoading ? (
                                    <div className={styles.generatingState}>
                                        <div className={styles.loadingDots}><span /><span /><span /></div>
                                        <p>Generating your DALL-E 3 raw design graphic…</p>
                                    </div>
                                ) : (
                                    <div className={styles.generatePromptBox}>
                                        <p>Generate a flat, <strong>{stylePref}</strong> style PNG design ready for Printful upload.</p>
                                        <p className={styles.costNote}>⚠️ Uses DALL-E 3 — costs ~$0.04 per image</p>
                                        <button className={styles.generateBtn} onClick={handleGenerateMockup} disabled={designDetailsLoading}>
                                            🖼️ Generate Raw Design Graphic
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Listing Copy */}
                            <div className={styles.detailSection}>
                                <h3 className={styles.detailSectionTitle}>📝 Etsy Listing Copy</h3>
                                {designDetailsLoading && !listingCopy
                                    ? <><SkeletonBox height={50} /><SkeletonBox height={100} /><SkeletonBox height={50} /></>
                                    : listingCopy?.success
                                        ? Object.entries(listingCopy.listing).map(([key, value]) => (
                                            <div key={key} className={styles.listingRow}>
                                                <div className={styles.briefRowHeader}>
                                                    <span className={styles.briefKey}>{key.replace(/_/g, ' ')}</span>
                                                    <CopyButton text={Array.isArray(value) ? (value as string[]).join(', ') : String(value)} />
                                                </div>
                                                <div className={styles.listingValue}>
                                                    {Array.isArray(value) ? (
                                                        <div className={styles.elementChips}>
                                                            {(value as string[]).map((t, i) => <span key={i} className={styles.elementChip}>{t}</span>)}
                                                        </div>
                                                    ) : <p>{String(value)}</p>}
                                                </div>
                                            </div>
                                        ))
                                        : <p className={styles.emptyState}>Listing copy will appear here after loading.</p>}
                            </div>

                            {/* Variations */}
                            <div className={styles.detailSection}>
                                <h3 className={styles.detailSectionTitle}>✨ Product Variations</h3>
                                {!designVariations && !variationsLoading && (
                                    <div className={styles.generatePromptBox}>
                                        <p>Generate 5 product variations (stickers, mugs, hoodies…) to expand your product line.</p>
                                        <button className={styles.generateBtn} style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }} onClick={handleGenerateVariations}>
                                            🔄 Generate 5 Variations
                                        </button>
                                    </div>
                                )}
                                {variationsLoading && (
                                    <div className={styles.generatingState}>
                                        <div className={styles.loadingDots}><span /><span /><span /></div>
                                        <p>Generating design variations…</p>
                                    </div>
                                )}
                                {designVariations?.success && (
                                    <div className={styles.variationsGrid}>
                                        {designVariations.variations.map((v, i) => (
                                            <div key={i} className={styles.variationCard}>
                                                <span className={styles.variationLabel}>{v.product_type}</span>
                                                {v.success && (v.image_url || v.fallback_url) ? (
                                                    <img src={v.image_url || v.fallback_url} alt={v.product_type} className={styles.variationImg} />
                                                ) : (
                                                    <div className={styles.variationEmpty}>⚠️ {v.error || 'Failed'}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Export */}
                            <div className={styles.exportSection}>
                                <button className={styles.exportBtn} onClick={handleExportDesign} disabled={!designBrief || !listingCopy}>
                                    📥 Export Design Package (JSON)
                                </button>
                                <p className={styles.exportHint}>Download full brief, listing copy & image URL for Printful upload</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
