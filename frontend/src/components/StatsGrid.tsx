import styles from './StatsGrid.module.css';

interface Props {
    stats: {
        total_revenue: number;
        total_profit: number;
        order_count: number;
        avg_margin_percent: number;
    };
}

export function StatsGrid({ stats }: Props) {
    return (
        <div className={styles.grid}>
            <div className={styles.card}>
                <span className={styles.label}>Total Revenue</span>
                <span className={styles.value}>${stats.total_revenue.toLocaleString()}</span>
            </div>
            <div className={styles.card}>
                <span className={styles.label}>Net Profit</span>
                <span className={styles.value} style={{ color: '#22c55e' }}>
                    ${stats.total_profit.toLocaleString()}
                </span>
            </div>
            <div className={styles.card}>
                <span className={styles.label}>Order Count</span>
                <span className={styles.value}>{stats.order_count}</span>
            </div>
            <div className={styles.card}>
                <span className={styles.label}>Avg Margin</span>
                <span className={styles.value}>{stats.avg_margin_percent}%</span>
            </div>
        </div>
    );
}
