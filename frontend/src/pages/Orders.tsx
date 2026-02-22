import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { StatsGrid } from '../components/StatsGrid';
import styles from './Orders.module.css';

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

export function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [ordersData, statsData] = await Promise.all([
                api.getOrders(50),
                api.getOrderStats()
            ]);
            setOrders(ordersData);
            setStats(statsData);
        } catch (e) {
            console.error("Failed to fetch order data", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await api.syncOrders();
            await fetchData();
        } catch (e) {
            alert("Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    if (loading && !orders.length) return <div className={styles.centered}>Loading...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Management Dashboard</h1>
                    <p className={styles.subtitle}>Unified view of Shopify + Etsy orders and profit metrics.</p>
                </div>
                <button
                    className={styles.btnSync}
                    onClick={handleSync}
                    disabled={syncing}
                >
                    {syncing ? '🔄 Syncing...' : '🔄 Sync Orders'}
                </button>
            </div>

            {stats && <StatsGrid stats={stats} />}

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Platform</th>
                            <th>Product</th>
                            <th>Rev</th>
                            <th>Cost</th>
                            <th>Profit</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => (
                            <tr key={o.id}>
                                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                                <td>
                                    <span className={`${styles.badge} ${styles[o.platform]}`}>
                                        {o.platform === 'shopify' ? '🟢 Shopify' : '🟠 Etsy'}
                                    </span>
                                </td>
                                <td>
                                    <div className={styles.productCell}>
                                        <span className={styles.title}>{o.product_title}</span>
                                        <span className={styles.variant}>{o.variant} (x{o.quantity})</span>
                                    </div>
                                </td>
                                <td>${o.revenue.toFixed(2)}</td>
                                <td>${o.printful_cost.toFixed(2)}</td>
                                <td className={o.profit > 0 ? styles.profitPos : styles.profitNeg}>
                                    ${o.profit.toFixed(2)}
                                </td>
                                <td>
                                    <span className={`${styles.status} ${styles[o.status]}`}>
                                        {o.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
