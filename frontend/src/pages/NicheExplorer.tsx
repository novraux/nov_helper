import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../api';
import styles from './NicheExplorer.module.css';

interface Competitor {
    title: string;
    price: string;
    url?: string;
    platform?: string;
}

interface Design {
    title: string;
    concept: string;
    elements: string[];
    product: string;
    demand_score: number;
    design_text: string;
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
    price_stats?: {
        min: number;
        max: number;
        avg: number;
        median: number;
    };
    market_gap_report: string;
    opportunity_score: number;
    platforms?: {
        etsy: number;
        redbubble: number;
    };
    top_competitors?: Competitor[];
}

interface NichePODAnalysis {
    success: boolean;
    niche: string;
    validation: ValidationResult;
    competitor_count: number;
    gap_analysis: string;
    designs?: {
        success: boolean;
        designs: DesignIdea[];
        niche: string;
        total: number;
    };
    next_step: string;
}

interface DesignBrief {
    success: boolean;
    brief: any;
    niche: string;
    design_title: string;
}

interface ListingCopy {
    success: boolean;
    listing: any;
    niche: string;
    design_title: string;
}

interface DesignMockup {
    success: boolean;
    image_url: string;
    design_title: string;
    product_type: string;
    niche: string;
}

interface DesignVariation {
    product_type: string;
    image_url?: string;
    success: boolean;
    error?: string;
    fallback_url?: string;
}

interface DesignVariations {
    success: boolean;
    design_title: string;
    niche: string;
    variations: DesignVariation[];
    total_generated: number;
}

interface Props {
    initialKeyword?: string;
}

export function NicheExplorer({ initialKeyword }: Props) {
    const [keyword, setKeyword] = useState(initialKeyword || '');
    const [stylePref, setStylePref] = useState('Balanced');
    const [loading, setLoading] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [designDetailsLoading, setDesignDetailsLoading] = useState(false);
    const [variationsLoading, setVariationsLoading] = useState(false);

    const [result, setResult] = useState<ValidationResult | null>(null);
    const [podAnalysis, setPodAnalysis] = useState<NichePODAnalysis | null>(null);
    const [selectedDesign, setSelectedDesign] = useState<DesignIdea | null>(null);
    const [designBrief, setDesignBrief] = useState<DesignBrief | null>(null);
    const [listingCopy, setListingCopy] = useState<ListingCopy | null>(null);
    const [mockupImage, setMockupImage] = useState<DesignMockup | null>(null);
    const [designVariations, setDesignVariations] = useState<DesignVariations | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'search' | 'designs' | 'design-detail'>('search');
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [saveToast, setSaveToast] = useState('');

    // Auto-search if coming from Trend Feed or URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const nicheQuery = urlParams.get('niche');
        const startKeyword = initialKeyword || nicheQuery;

        if (startKeyword) {
            setKeyword(startKeyword);
            handleSearch(null, startKeyword);
        }
    }, [initialKeyword]);

    const handleSearch = async (e?: React.FormEvent | null, searchKw?: string) => {
        if (e) e.preventDefault();
        const kw = searchKw || keyword;
        if (!kw.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await api.exploreNiche(kw);
            setResult(data);
            setView('search');
        } catch (err: any) {
            setError(err.message || 'Something went wrong during exploration.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzePOD = async (niche: string) => {
        setAnalysisLoading(true);
        setError(null);

        try {
            const data = await fetch(`http://localhost:8000/research/niche/analyze?niche=${encodeURIComponent(niche)}&generate_designs=true&style_preference=${encodeURIComponent(stylePref)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            }).then((r) => r.json());

            if (!data.success) {
                setError(data.error || 'Failed to analyze niche');
                return;
            }

            setPodAnalysis(data);
            setSelectedDesign(null);
            setDesignBrief(null);
            setListingCopy(null);
            setMockupImage(null);
            setDesignVariations(null);
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

        try {
            // Fetch design brief
            const briefData = await fetch(
                `http://localhost:8000/research/design/brief?niche=${encodeURIComponent(podAnalysis?.niche || '')}&design_title=${encodeURIComponent(design.title)}&design_concept=${encodeURIComponent(design.concept)}&style_preference=${encodeURIComponent(stylePref)}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' } }
            ).then((r) => r.json());

            setDesignBrief(briefData);

            // Fetch listing copy
            const listingData = await fetch(
                `http://localhost:8000/research/design/listing?niche=${encodeURIComponent(podAnalysis?.niche || '')}&design_title=${encodeURIComponent(design.title)}&design_text=${encodeURIComponent(design.design_text)}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' } }
            ).then((r) => r.json());

            setListingCopy(listingData);

            // OPTIMIZATION: Do not auto-generate mockup image
            setMockupImage(null);
            setDesignVariations(null);

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
            const mockupData = await fetch(
                `http://localhost:8000/research/design/mockup?niche=${encodeURIComponent(podAnalysis.niche)}&design_title=${encodeURIComponent(selectedDesign.title)}&design_concept=${encodeURIComponent(selectedDesign.concept)}&design_text=${encodeURIComponent(selectedDesign.design_text)}&product_type=${encodeURIComponent(selectedDesign.product)}&style_preference=${encodeURIComponent(stylePref)}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' } }
            ).then((r) => r.json());

            if (!mockupData.success) throw new Error(mockupData.error || 'Failed to generate mockup');
            setMockupImage(mockupData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDesignDetailsLoading(false);
        }
    };

    const handleGenerateVariations = async () => {
        if (!selectedDesign || !podAnalysis) {
            setError('Design not loaded');
            return;
        }

        setVariationsLoading(true);
        setError(null);

        try {
            const variationsData = await fetch(
                `http://localhost:8000/research/design/variations?niche=${encodeURIComponent(podAnalysis.niche)}&design_title=${encodeURIComponent(selectedDesign.title)}&design_concept=${encodeURIComponent(selectedDesign.concept)}&num_variations=5&style_preference=${encodeURIComponent(stylePref)}`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' } }
            ).then((r) => r.json());

            setDesignVariations(variationsData);
        } catch (err: any) {
            setError(err.message || 'Failed to generate product variations');
        } finally {
            setVariationsLoading(false);
        }
    };

    const showSaveToast = (msg: string) => {
        setSaveToast(msg);
        setTimeout(() => setSaveToast(''), 2500);
    };

    const handleSaveToVault = async (design: DesignIdea, e: React.MouseEvent) => {
        e.stopPropagation();
        const key = `${podAnalysis?.niche}::${design.title}`;
        if (savedIds.has(key)) return;
        try {
            await api.saveDesign({
                niche: podAnalysis?.niche || keyword,
                title: design.title,
                concept: design.concept,
                design_text: design.design_text,
                product_type: design.product,
                style_preference: stylePref,
                demand_score: design.demand_score,
                elements: design.elements,
            });
            setSavedIds(prev => new Set([...prev, key]));
            showSaveToast(`"${design.title}" saved to Vault ✓`);
        } catch {
            showSaveToast('Failed to save — is backend running?');
        }
    };

    const handleSaveCurrentToVault = async () => {
        if (!selectedDesign || !podAnalysis) return;
        const key = `${podAnalysis.niche}::${selectedDesign.title}`;
        try {
            await api.saveDesign({
                niche: podAnalysis.niche,
                title: selectedDesign.title,
                concept: selectedDesign.concept,
                design_text: selectedDesign.design_text,
                product_type: selectedDesign.product,
                style_preference: stylePref,
                demand_score: selectedDesign.demand_score,
                elements: selectedDesign.elements,
                mockup_url: mockupImage?.success ? mockupImage.image_url : undefined,
            });
            setSavedIds(prev => new Set([...prev, key]));
            showSaveToast(`"${selectedDesign.title}" saved to Vault ✓`);
        } catch {
            showSaveToast('Failed to save — is backend running?');
        }
    };

    const handleExportDesign = () => {
        if (!selectedDesign || !designBrief || !listingCopy) {
            setError('Design details not loaded');
            return;
        }

        const exportData = {
            niche: podAnalysis?.niche,
            design: selectedDesign,
            brief: designBrief.brief,
            listing: listingCopy.listing,
            mockup_image: mockupImage?.success ? mockupImage.image_url : null,
            product_variations: designVariations?.variations || [],
            exported_at: new Date().toISOString()
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `design-${selectedDesign.title.toLowerCase().replace(/\s+/g, '-')}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={styles.container}>
            {/* SEARCH VIEW */}
            {view === 'search' && (
                <>
                    <header className={styles.header}>
                        <h1 className={styles.title}>🎨 Niche Explorer for POD</h1>
                        <p className={styles.subtitle}>Find profitable niches, generate designs, export to Printful</p>

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
                                {loading ? 'Analyzing...' : 'Search Niche'}
                            </button>
                        </form>
                    </header>

                    {loading && (
                        <div className={styles.loadingArea}>
                            <div className={styles.spinner}></div>
                            <p className={styles.loadingText}>Scraping Etsy & Redbubble... Running AI Analysis...</p>
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
                                        <span className={styles.scoreLabel}>AI Opportunity Score</span>
                                    </div>
                                    <div className={styles.scoreStatus}>
                                        {result.opportunity_score > 70 ? '💎 High Opportunity' :
                                            result.opportunity_score > 40 ? '⚡ Moderate Potential' : '🔥 Risky / Saturated'}
                                    </div>
                                </div>

                                <div className={styles.marketStats}>
                                    <div className={styles.statItem}>
                                        <span className={styles.statLabel}>Found Listings</span>
                                        <span className={styles.statValue}>{result.listing_count.toLocaleString()}</span>
                                        <span className={styles.statSub}>
                                            {result.platforms ? `Etsy (${result.platforms.etsy}) + RB (${result.platforms.redbubble})` : 'Cross-platform'}
                                        </span>
                                    </div>
                                    {result.price_stats && (
                                        <div className={styles.statItem}>
                                            <span className={styles.statLabel}>Avg Market Price</span>
                                            <span className={styles.statValue}>${result.price_stats.avg.toFixed(2)}</span>
                                            <span className={styles.statSub}>Range: ${result.price_stats.min} - ${result.price_stats.max}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <section className={styles.reportSection}>
                                <h2 className={styles.sectionTitle}>
                                    <span style={{ marginRight: '12px' }}>📊</span>
                                    Market Opportunity Analysis
                                </h2>
                                <div className={styles.reportContent}>
                                    <ReactMarkdown>{result.market_gap_report}</ReactMarkdown>
                                </div>
                            </section>

                            <div className={styles.optionsContainer} style={{ animationDelay: '0.2s' }}>
                                <div className={styles.sectionHeader}>
                                    <div>
                                        <h3 className={styles.sectionTitle} style={{ marginBottom: '4px' }}>🎨 Style Options & Generation</h3>
                                        <p className={styles.description}>Customize the visual style before generating ideas.</p>
                                    </div>
                                </div>

                                <div className={styles.stylePills}>
                                    {['Text-Only', 'Minimalist', 'Graphic-Heavy', 'Vintage Retro', 'Balanced'].map(style => (
                                        <button
                                            key={style}
                                            onClick={() => setStylePref(style)}
                                            className={`${styles.stylePill} ${stylePref === style ? styles.stylePillActive : ''}`}
                                        >
                                            {style}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    className={styles.ctaButton}
                                    onClick={() => handleAnalyzePOD(result.keyword)}
                                    disabled={analysisLoading}
                                >
                                    {analysisLoading ? '🔄 Generating Designs...' : `🎨 Generate ${stylePref} Designs for This Niche`}
                                </button>
                            </div>

                            {result.top_competitors && result.top_competitors.length > 0 && (
                                <>
                                    <h2 className={styles.sectionTitle}>🏆 Top Competition Examples</h2>
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
                                </>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* DESIGNS VIEW */}
            {view === 'designs' && podAnalysis && (
                <div className={styles.designsView}>
                    <header className={styles.subHeader}>
                        <button className={styles.backButton} onClick={() => setView('search')}>
                            ← Back to Search
                        </button>
                        <h2 className={styles.subtitle}>🎨 Design Ideas for "{podAnalysis.niche}"</h2>
                        <p className={styles.description}>Click on any design card to generate a full brief and Etsy listing copy</p>
                    </header>

                    {error && (
                        <div className={styles.errorCard}>
                            <span className={styles.errorIcon}>⚠️</span>
                            <p>{error}</p>
                        </div>
                    )}

                    {podAnalysis.designs && podAnalysis.designs.success && (
                        <div className={styles.designsGrid}>
                            {podAnalysis.designs.designs.map((design, i) => (
                                <div
                                    key={i}
                                    className={styles.designCard}
                                    onClick={() => handleSelectDesign(design)}
                                    style={{ animationDelay: `${i * 0.1}s` } as any}
                                >
                                    <div className={styles.designHeader}>
                                        <span className={styles.demandBadge}>Demand: {design.demand_score}/10</span>
                                        <span className={styles.productType}>{design.product}</span>
                                    </div>
                                    <h3 className={styles.designTitle}>{design.title}</h3>
                                    <p className={styles.designConcept}>{design.concept}</p>
                                    <div className={styles.designElements}>
                                        <strong>Elements:</strong>
                                        <div className={styles.elementsList}>
                                            {design.elements.map((el, j) => (
                                                <span key={j} className={styles.element}>{el}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className={styles.designText}>
                                        <strong>Design Text:</strong> "{design.design_text}"
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                        <button className={styles.selectButton} style={{ flex: 1 }}>
                                            View Details & Listing →
                                        </button>
                                        <button
                                            id={`save-vault-${i}`}
                                            onClick={(e) => handleSaveToVault(design, e)}
                                            className={`${styles.saveButton} ${savedIds.has(`${podAnalysis.niche}::${design.title}`) ? styles.saveButtonSaved : styles.saveButtonDraft}`}
                                        >
                                            {savedIds.has(`${podAnalysis.niche}::${design.title}`) ? '✓ Saved' : '🗂 Save'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* DESIGN DETAIL VIEW */}
            {view === 'design-detail' && selectedDesign && podAnalysis && (
                <div className={styles.detailView}>
                    <header className={styles.subHeader}>
                        <button className={styles.backButton} onClick={() => setView('designs')}>
                            ← Back to Designs
                        </button>
                        <h2 className={styles.subtitle}>🎬 Complete Design Brief</h2>
                        <p className={styles.description}>All information you need to create & list this design on Etsy</p>
                    </header>

                    {error && (
                        <div className={styles.errorCard}>
                            <span className={styles.errorIcon}>⚠️</span>
                            <p>{error}</p>
                        </div>
                    )}

                    <div className={styles.detailsContainer}>
                        {/* DESIGN OVERVIEW */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>📋 Design Overview</h3>
                            <div className={styles.detailGrid}>
                                <div className={styles.detailItem}>
                                    <strong>Title:</strong> {selectedDesign.title}
                                </div>
                                <div className={styles.detailItem}>
                                    <strong>Concept:</strong> {selectedDesign.concept}
                                </div>
                                <div className={styles.detailItem}>
                                    <strong>Product Type:</strong> {selectedDesign.product}
                                </div>
                                <div className={styles.detailItem}>
                                    <strong>Design Text:</strong> "{selectedDesign.design_text}"
                                </div>
                                <div className={styles.detailItem}>
                                    <strong>Demand Score:</strong> {selectedDesign.demand_score}/10
                                </div>
                            </div>
                        </section>

                        {/* RAW DESIGN GENERATION */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>🖼️ Raw Design Graphic</h3>

                            {!mockupImage && !designDetailsLoading && (
                                <div style={{ textAlign: 'center', padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
                                    <p style={{ marginBottom: '16px', color: '#4b5563' }}>
                                        Image generation costs money. Click the button below to explicitly generate a raw, flat <strong>{stylePref}</strong> PNG graphic using DALL-E 3, suitable for Printful upload.
                                    </p>
                                    <button
                                        onClick={handleGenerateMockup}
                                        style={{
                                            padding: '12px 24px',
                                            backgroundColor: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        🖼️ Generate 1 Raw Design Graphic (DALL-E)
                                    </button>
                                </div>
                            )}

                            {designDetailsLoading && !mockupImage && (
                                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>⏳ Generating your DALL-E 3 raw design graphic...</p>
                            )}

                            {mockupImage && mockupImage.success && (
                                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                    <img src={mockupImage.image_url} alt="Generated Raw Design" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid #eee' }} />
                                    <p style={{ color: '#666', marginTop: '10px' }}>AI-generated raw design graphic for "{selectedDesign.title}"</p>
                                </div>
                            )}
                        </section>

                        {/* DESIGN BRIEF */}
                        {designBrief && designBrief.success && (
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>🎨 Detailed Design Brief</h3>
                                <div className={styles.briefContent}>
                                    {Object.entries(designBrief.brief).map(([key, value]) => (
                                        <div key={key} className={styles.briefItem}>
                                            <strong>{key.replace(/_/g, ' ')}:</strong>
                                            <div className={styles.briefValue}>
                                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* LISTING COPY */}
                        {listingCopy && listingCopy.success && (
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>📝 Etsy Listing Copy</h3>
                                <div className={styles.listingContent}>
                                    {Object.entries(listingCopy.listing).map(([key, value]) => (
                                        <div key={key} className={styles.listingItem}>
                                            <strong>{key.replace(/_/g, ' ')}:</strong>
                                            <div className={styles.listingValue}>
                                                {Array.isArray(value) ? (
                                                    <ul>
                                                        {value.map((tag, j) => (
                                                            <li key={j}>{String(tag)}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p>{String(value)}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* PRODUCT VARIATIONS */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>✨ Product Variations</h3>
                            {!designVariations && !variationsLoading && (
                                <div style={{ textAlign: 'center', padding: '20px', background: '#f3f4f6', borderRadius: '8px' }}>
                                    <p style={{ marginBottom: '16px', color: '#4b5563' }}>
                                        Generate additional design variations based on the original concept to expand your product line.
                                    </p>
                                    <button
                                        onClick={handleGenerateVariations}
                                        style={{
                                            padding: '12px 24px',
                                            backgroundColor: '#6366f1',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '1rem',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        🔄 Generate 5 Design Variations
                                    </button>
                                </div>
                            )}

                            {variationsLoading && !designVariations && (
                                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>⏳ Generating design variations...</p>
                            )}

                            {designVariations && designVariations.success && designVariations.variations && (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                    gap: '15px',
                                    marginTop: '15px'
                                }}>
                                    {designVariations.variations.map((variation, idx) => (
                                        <div key={idx} className={styles.designCard} style={{ cursor: 'default', border: '1px solid #e5e7eb', padding: '15px' }}>
                                            <div className={styles.designHeader}>
                                                <span className={styles.productType} style={{ textTransform: 'capitalize' }}>{variation.product_type}</span>
                                            </div>

                                            {variation.success && variation.image_url ? (
                                                <img
                                                    src={variation.image_url}
                                                    alt={variation.product_type}
                                                    style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '6px', marginTop: '10px' }}
                                                />
                                            ) : variation.fallback_url ? (
                                                <img
                                                    src={variation.fallback_url}
                                                    alt={variation.product_type}
                                                    style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '6px', marginTop: '10px' }}
                                                />
                                            ) : (
                                                <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', borderRadius: '6px', marginTop: '10px' }}>
                                                    <p style={{ color: '#999' }}>⚠️ {variation.error || 'Failed to generate'}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* EXPORT BUTTON */}
                        <div className={styles.actionButtons}>
                            <button
                                id="save-current-vault"
                                onClick={handleSaveCurrentToVault}
                                className={`${styles.saveButton} ${savedIds.has(`${podAnalysis.niche}::${selectedDesign.title}`) ? styles.saveButtonSaved : styles.saveButtonDraft}`}
                                style={{ padding: '12px 24px', fontSize: '0.9rem' }}
                            >
                                {savedIds.has(`${podAnalysis.niche}::${selectedDesign.title}`) ? '✓ Saved to Vault' : '🗂 Save to Vault'}
                            </button>
                            <button
                                className={styles.exportButton}
                                onClick={handleExportDesign}
                                disabled={!designBrief || !listingCopy}
                            >
                                📥 Export Design Package (JSON)
                            </button>
                            <p className={styles.hint}>Download all design details to your computer, then upload to Printful</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Save toast */}
            {saveToast && (
                <div className={styles.toast}>
                    🗂 {saveToast}
                </div>
            )}
        </div>
    );
}
