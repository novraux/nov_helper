import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import styles from './ShopifySEO.module.css';

interface Product {
    id: number;
    title: string;
    handle: string;
    body_html: string;
    tags: string;
    images: { src: string }[];
}

interface SEOResult {
    product_id: number;
    title: string;
    seo_title?: string;
    meta_description?: string;
    product_description?: string;
    tags?: string[];
    seo_score?: number;
    seo_notes?: string;
    model_used?: string;
    error?: string;
    pushed?: boolean;
}

export function ShopifySEO() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<number | null>(null);
    const [pushing, setPushing] = useState<number | null>(null);
    const [previews, setPreviews] = useState<Record<number, SEOResult>>({});
    const [error, setError] = useState<string | null>(null);
    const [useSmartModel, setUseSmartModel] = useState(false);

    // Bulk state
    const [bulkJobId, setBulkJobId] = useState<string | null>(null);
    const [bulkStatus, setBulkStatus] = useState<'idle' | 'running' | 'done'>('idle');

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.getShopifyProducts(50);
            setProducts(data.products ?? []);
        } catch (e) {
            setError("Could not reach backend or Shopify API.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Poll for bulk job results
    useEffect(() => {
        let interval: number | undefined;
        if (bulkJobId && bulkStatus === 'running') {
            interval = window.setInterval(async () => {
                try {
                    const data = await api.getBulkSEOResults(bulkJobId);
                    // Update previews with whatever matches
                    const resultsObj: Record<number, SEOResult> = {};
                    data.results.forEach((item: any) => {
                        resultsObj[item.product_id] = {
                            product_id: item.product_id,
                            title: item.title,
                            pushed: item.pushed,
                            ...item.seo
                        };
                    });
                    setPreviews(prev => ({ ...prev, ...resultsObj }));

                    // If counting matches expected? Or just let it run.
                    // For now we just poll.
                } catch (e) {
                    console.error("Bulk poll failed", e);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [bulkJobId, bulkStatus]);

    async function handleGenerateSingle(productId: number) {
        setGenerating(productId);
        try {
            const data = await api.generateProductSEO(productId, useSmartModel);
            setPreviews((prev) => ({ ...prev, [productId]: data }));
        } catch (e: any) {
            setPreviews((prev) => ({
                ...prev,
                [productId]: { product_id: productId, title: "", error: String(e) },
            }));
        } finally {
            setGenerating(null);
        }
    }

    async function handlePushSingle(productId: number) {
        const preview = previews[productId];
        if (!preview || preview.error) return;
        setPushing(productId);
        try {
            await api.pushSEOToShopify({
                product_id: productId,
                seo_title: preview.seo_title ?? "",
                meta_description: preview.meta_description ?? "",
                tags: preview.tags ?? [],
                product_description: preview.product_description ?? undefined,
            });
            setPreviews((prev) => ({
                ...prev,
                [productId]: { ...prev[productId], pushed: true },
            }));
        } catch (e: any) {
            alert(`Push failed: ${e}`);
        } finally {
            setPushing(null);
        }
    }

    async function handleBulkGenerate() {
        if (!confirm("Start AI SEO generation for ALL listed products?")) return;
        setBulkStatus('running');
        try {
            const data = await api.startBulkSEO(undefined, useSmartModel, false);
            setBulkJobId(data.job_id);
        } catch (e) {
            alert("Failed to start bulk job");
            setBulkStatus('idle');
        }
    }

    function scoreColor(score?: number) {
        if (score === undefined) return "#666";
        if (score >= 80) return "#22c55e";
        if (score >= 60) return "#f59e0b";
        return "#ef4444";
    }

    if (loading) return (
        <div className={styles.centered}>
            <div className={styles.spinner} />
            <p>Loading Shopify products…</p>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Shopify SEO Optimizer</h1>
                    <p className={styles.subtitle}>
                        {products.length} products · AI-powered SEO generation + one-click push
                    </p>
                </div>
                <div className={styles.headerControls}>
                    <label className={styles.toggle}>
                        <input
                            type="checkbox"
                            checked={useSmartModel}
                            onChange={(e) => setUseSmartModel(e.target.checked)}
                        />
                        <span>Smart model (70B)</span>
                    </label>
                    <button
                        className={styles.btnBulk}
                        onClick={handleBulkGenerate}
                        disabled={bulkStatus === 'running'}
                    >
                        {bulkStatus === 'running' ? '🚀 Bulk Processing...' : '✦ Bulk Optimize All'}
                    </button>
                    <button className={styles.btnRefresh} onClick={fetchProducts}>⟳</button>
                </div>
            </div>

            {error && <div className={styles.errorBanner}>{error}</div>}

            <div className={styles.productList}>
                {products.map((p) => {
                    const preview = previews[p.id];
                    const isGenerating = generating === p.id;
                    const isPushing = pushing === p.id;

                    return (
                        <div key={p.id} className={`${styles.card} ${preview?.pushed ? styles.pushed : ""}`}>
                            <div className={styles.productRow}>
                                {p.images?.[0] && (
                                    <img src={p.images[0].src} alt={p.title} className={styles.thumb} />
                                )}
                                <div className={styles.productInfo}>
                                    <div className={styles.productTitle}>{p.title}</div>
                                    <div className={styles.productHandle}>/{p.handle}</div>
                                    <div className={styles.currentTags}>Tags: {p.tags || "none"}</div>
                                </div>
                                <div className={styles.actions}>
                                    {!preview && (
                                        <button
                                            className={styles.btnPrimary}
                                            onClick={() => handleGenerateSingle(p.id)}
                                            disabled={isGenerating}
                                        >
                                            {isGenerating ? "Generating…" : "✦ Generate SEO"}
                                        </button>
                                    )}
                                    {preview && !preview.pushed && !preview.error && (
                                        <>
                                            <button
                                                className={styles.btnSecondary}
                                                onClick={() => handleGenerateSingle(p.id)}
                                                disabled={isGenerating}
                                            >
                                                {isGenerating ? "…" : "↺"}
                                            </button>
                                            <button
                                                className={styles.btnPush}
                                                onClick={() => handlePushSingle(p.id)}
                                                disabled={isPushing}
                                            >
                                                {isPushing ? "Pushing…" : "▲ Push to Shopify"}
                                            </button>
                                        </>
                                    )}
                                    {preview?.pushed && <span className={styles.pushedBadge}>✓ Pushed</span>}
                                </div>
                            </div>

                            {preview && !preview.error && (
                                <div className={styles.preview}>
                                    <div className={styles.previewHeader}>
                                        <span className={styles.modelTag}>{preview.model_used}</span>
                                        {preview.seo_score !== undefined && (
                                            <span className={styles.scoreTag} style={{ color: scoreColor(preview.seo_score) }}>
                                                SEO {preview.seo_score}/100
                                            </span>
                                        )}
                                        {preview.seo_notes && <span className={styles.notes}>💡 {preview.seo_notes}</span>}
                                    </div>
                                    <div className={styles.seoGrid}>
                                        <div className={styles.seoItem}>
                                            <div className={styles.seoLabel}>Optimized Title</div>
                                            <div className={styles.seoValue}>{preview.seo_title}</div>
                                        </div>
                                        <div className={styles.seoItem}>
                                            <div className={styles.seoLabel}>Meta Description</div>
                                            <div className={styles.seoValue}>{preview.meta_description}</div>
                                        </div>
                                    </div>
                                    <div className={styles.tagList}>
                                        {preview.tags?.map((t) => (
                                            <span key={t} className={styles.tag}>{t}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {preview?.error && <div className={styles.errorPreview}>⚠ {preview.error}</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
