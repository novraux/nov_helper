import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { api } from '../api';
import styles from './Orders.module.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// ── Types ─────────────────────────────────────────────────────────────────────

interface Order {
    id: number;
    platform: string;
    external_order_id: string;
    product_title: string;
    variant: string;
    quantity: number;
    revenue: number;
    printful_cost: number;
    profit: number;
    status: string;
    created_at: string;
}

interface PlatformStat {
    platform: string;
    revenue: number;
    profit: number;
    orders: number;
    margin: number;
}

interface TopProduct {
    title: string;
    revenue: number;
    profit: number;
    orders: number;
    margin: number;
}

interface DayPoint {
    date: string;
    revenue: number;
    profit: number;
}

interface Stats {
    total_revenue: number;
    total_profit: number;
    total_cost: number;
    order_count: number;
    avg_margin_percent: number;
    platform_breakdown: PlatformStat[];
    top_products: TopProduct[];
    daily_timeseries: DayPoint[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
    n >= 1000
        ? `$${(n / 1000).toFixed(1)}k`
        : `$${n.toFixed(2)}`;

const marginColor = (m: number) =>
    m >= 40 ? '#34d399' : m >= 20 ? '#fbbf24' : '#f87171';

const PLATFORM_EMOJI: Record<string, string> = {
    shopify: '🟢 Shopify',
    etsy: '🟠 Etsy',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [ordersData, statsData] = await Promise.all([
                api.getOrders(100),
                api.getOrderStats(),
            ]);
            setOrders(ordersData);
            setStats(statsData);
        } catch (e) {
            console.error('Failed to fetch order data', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await api.syncOrders();
            await fetchData();
        } catch {
            alert('Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    // ── Chart config ──────────────────────────────────────────────────────────

    const chartData = stats ? {
        labels: stats.daily_timeseries.map(d => {
            const dt = new Date(d.date);
            return `${dt.getMonth() + 1}/${dt.getDate()}`;
        }),
        datasets: [
            {
                label: 'Revenue',
                data: stats.daily_timeseries.map(d => d.revenue),
                backgroundColor: 'rgba(96,165,250,0.6)',
                borderRadius: 4,
            },
            {
                label: 'Profit',
                data: stats.daily_timeseries.map(d => d.profit),
                backgroundColor: 'rgba(52,211,153,0.7)',
                borderRadius: 4,
            },
        ],
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: { color: '#9ca3af', font: { size: 11 } },
            },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => `${ctx.dataset.label}: $${ctx.raw.toFixed(2)}`,
                },
            },
        },
        scales: {
            x: {
                ticks: { color: '#6b7280', font: { size: 10 }, maxTicksLimit: 10 },
                grid: { color: 'rgba(255,255,255,0.04)' },
            },
            y: {
                ticks: {
                    color: '#6b7280',
                    font: { size: 10 },
                    callback: (v: any) => `$${v}`,
                },
                grid: { color: 'rgba(255,255,255,0.04)' },
            },
        },
    };

    // ── Render ────────────────────────────────────────────────────────────────

    if (loading && !orders.length) {
        return <div className={styles.loading}>Loading revenue data…</div>;
    }

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleBlock}>
                    <h1>💰 Revenue & Profit Dashboard</h1>
                    <p>Unified view of Shopify + Etsy orders — revenue, cost, profit & margin</p>
                </div>
                <button
                    className={styles.syncBtn}
                    onClick={handleSync}
                    disabled={syncing}
                    id="sync-orders-btn"
                >
                    {syncing ? '🔄 Syncing…' : '↻ Sync Orders'}
                </button>
            </div>

            <div className={styles.body}>
                {/* KPI cards */}
                {stats ? (
                    <div className={styles.kpiGrid}>
                        <div className={`${styles.kpiCard} ${styles.kpiBlue}`}>
                            <span className={styles.kpiLabel}>Total Revenue</span>
                            <span className={styles.kpiValue}>{fmt(stats.total_revenue)}</span>
                            <span className={styles.kpiSub}>{stats.order_count} orders</span>
                        </div>
                        <div className={`${styles.kpiCard} ${styles.kpiGreen}`}>
                            <span className={styles.kpiLabel}>Net Profit</span>
                            <span className={styles.kpiValue}>{fmt(stats.total_profit)}</span>
                            <span className={styles.kpiSub}>after Printful costs</span>
                        </div>
                        <div className={`${styles.kpiCard} ${styles.kpiOrange}`}>
                            <span className={styles.kpiLabel}>Printful Costs</span>
                            <span className={styles.kpiValue}>{fmt(stats.total_cost)}</span>
                            <span className={styles.kpiSub}>fulfillment spend</span>
                        </div>
                        <div className={`${styles.kpiCard} ${styles.kpiPurple}`}>
                            <span className={styles.kpiLabel}>Avg Margin</span>
                            <span className={styles.kpiValue}>{stats.avg_margin_percent.toFixed(1)}%</span>
                            <span className={styles.kpiSub}>profit / revenue</span>
                        </div>
                    </div>
                ) : (
                    <div className={styles.kpiGrid}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={`${styles.kpiCard} ${styles.skeletonKpi}`}></div>
                        ))}
                    </div>
                )}

                {/* Revenue vs Profit chart */}
                {chartData && (
                    <div className={styles.section}>
                        <p className={styles.sectionTitle}>📈 Revenue vs Profit — Last 30 Days</p>
                        <div className={styles.chartWrap}>
                            <Bar data={chartData} options={chartOptions as any} />
                        </div>
                    </div>
                )}

                {/* Platform breakdown + Top products — side by side on wide screens */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '16px' }}>
                    {/* Platform split */}
                    {stats && (
                        <div className={styles.section}>
                            <p className={styles.sectionTitle}>🏪 Platform Breakdown</p>
                            {stats.platform_breakdown.length === 0 ? (
                                <div className={styles.empty}>No platform data yet</div>
                            ) : (
                                <div className={styles.platformGrid}>
                                    {stats.platform_breakdown.map(p => (
                                        <div key={p.platform} className={styles.platformCard}>
                                            <span className={styles.platformName}>
                                                {PLATFORM_EMOJI[p.platform] || p.platform}
                                            </span>
                                            <div className={styles.platformRow}>
                                                <span>Revenue</span>
                                                <strong>{fmt(p.revenue)}</strong>
                                            </div>
                                            <div className={styles.platformRow}>
                                                <span>Profit</span>
                                                <strong style={{ color: '#34d399' }}>{fmt(p.profit)}</strong>
                                            </div>
                                            <div className={styles.platformRow}>
                                                <span>Margin</span>
                                                <strong style={{ color: marginColor(p.margin) }}>{p.margin}%</strong>
                                            </div>
                                            <div className={styles.platformRow}>
                                                <span>Orders</span>
                                                <strong>{p.orders}</strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Top products */}
                    {stats && (
                        <div className={styles.section}>
                            <p className={styles.sectionTitle}>🏆 Top Products by Profit</p>
                            {stats.top_products.length === 0 ? (
                                <div className={styles.empty}>No product data yet</div>
                            ) : (
                                <table className={styles.topTable}>
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Sales</th>
                                            <th>Profit</th>
                                            <th>Margin</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.top_products.map((p, i) => (
                                            <tr key={i}>
                                                <td className={styles.productTitle} title={p.title}>{p.title}</td>
                                                <td>{p.orders}</td>
                                                <td style={{ color: '#34d399', fontWeight: 600 }}>{fmt(p.profit)}</td>
                                                <td>
                                                    <div className={styles.marginBar}>
                                                        <div className={styles.marginTrack}>
                                                            <div
                                                                className={styles.marginFill}
                                                                style={{
                                                                    width: `${Math.min(p.margin, 100)}%`,
                                                                    background: marginColor(p.margin),
                                                                }}
                                                            />
                                                        </div>
                                                        <span
                                                            className={styles.marginText}
                                                            style={{ color: marginColor(p.margin) }}
                                                        >
                                                            {p.margin}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>

                {/* Full order table */}
                <div className={styles.section}>
                    <p className={styles.sectionTitle}>📋 Order History ({orders.length})</p>
                    {orders.length === 0 ? (
                        <div className={styles.empty}>
                            No orders yet — click ↻ Sync Orders to import from Shopify
                        </div>
                    ) : (
                        <div className={styles.tableWrap}>
                            <table className={styles.ordersTable}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Platform</th>
                                        <th>Product</th>
                                        <th>Revenue</th>
                                        <th>Cost</th>
                                        <th>Profit</th>
                                        <th>Margin</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(o => {
                                        const margin = o.revenue > 0
                                            ? (o.profit / o.revenue * 100)
                                            : 0;
                                        return (
                                            <tr key={o.id}>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    {new Date(o.created_at).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <span className={`${styles.platformBadge} ${styles[o.platform]}`}>
                                                        {o.platform === 'shopify' ? '🟢 Shopify' : '🟠 Etsy'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.productCell}>
                                                        <span className={styles.productName}>{o.product_title}</span>
                                                        <span className={styles.productVariant}>
                                                            {o.variant} (×{o.quantity})
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>${o.revenue.toFixed(2)}</td>
                                                <td>${o.printful_cost.toFixed(2)}</td>
                                                <td className={o.profit >= 0 ? styles.profitPos : styles.profitNeg}>
                                                    ${o.profit.toFixed(2)}
                                                </td>
                                                <td style={{ color: marginColor(margin), fontWeight: 600 }}>
                                                    {margin.toFixed(1)}%
                                                </td>
                                                <td>
                                                    <span className={styles.statusBadge}>{o.status}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
