import styles from './ScoreBadge.module.css';

interface Props {
    score: number | null;
}

export function ScoreBadge({ score }: Props) {
    if (score === null) return <span className={styles.unknown}>–</span>;

    const className =
        score >= 7 ? styles.green : score >= 4 ? styles.yellow : styles.red;

    return (
        <span className={`${styles.badge} ${className}`}>
            {score.toFixed(1)}
        </span>
    );
}

interface CompBadgeProps {
    level: string | null;
}

export function CompetitionBadge({ level }: CompBadgeProps) {
    if (!level) return null;
    const cls =
        level === 'low' ? styles.green : level === 'medium' ? styles.yellow : styles.red;
    return (
        <span className={`${styles.badge} ${cls}`}>
            {level} comp
        </span>
    );
}

interface IPBadgeProps {
    ipSafe: boolean | null;
}

export function IPBadge({ ipSafe }: IPBadgeProps) {
    if (ipSafe === null) return null;
    return (
        <span className={`${styles.badge} ${ipSafe ? styles.green : styles.red}`}>
            {ipSafe ? '✓ IP Safe' : '⚠ IP Risk'}
        </span>
    );
}

// === Enhanced Badges (Phase 1) ===

interface MomentumBadgeProps {
    velocity: 'rising' | 'stable' | 'declining' | null;
}

export function MomentumBadge({ velocity }: MomentumBadgeProps) {
    if (!velocity) return null;

    const config = {
        rising: { emoji: '🚀', label: 'Rising', className: styles.green },
        stable: { emoji: '📊', label: 'Stable', className: styles.blue },
        declining: { emoji: '📉', label: 'Declining', className: styles.red },
    };

    const { emoji, label, className } = config[velocity];

    return (
        <span className={`${styles.badge} ${className}`}>
            {emoji} {label}
        </span>
    );
}

interface UrgencyBadgeProps {
    urgency: 'urgent' | 'plan_ahead' | 'evergreen' | 'standard' | null;
}

export function UrgencyBadge({ urgency }: UrgencyBadgeProps) {
    if (!urgency || urgency === 'standard') return null;

    const config = {
        urgent: { emoji: '⚡', label: 'Urgent', className: styles.orange },
        plan_ahead: { emoji: '📅', label: 'Plan Ahead', className: styles.yellow },
        evergreen: { emoji: '♻️', label: 'Evergreen', className: styles.purple },
        standard: { emoji: '', label: '', className: '' },
    };

    const { emoji, label, className } = config[urgency];

    return (
        <span className={`${styles.badge} ${className}`}>
            {emoji} {label}
        </span>
    );
}

interface InterestBadgeProps {
    interest: number | null;
}

export function InterestBadge({ interest }: InterestBadgeProps) {
    if (interest === null || interest === undefined) return null;

    const className =
        interest >= 70 ? styles.green :
        interest >= 50 ? styles.blue :
        interest >= 30 ? styles.yellow : styles.red;

    return (
        <span className={`${styles.badge} ${className}`}>
            📊 Interest: {interest}
        </span>
    );
}

interface CostBadgeProps {
    cost: number;
    cached?: boolean;
}

export function CostBadge({ cost, cached }: CostBadgeProps) {
    if (cached) {
        return (
            <span className={`${styles.badge} ${styles.green}`}>
                💰 Cached
            </span>
        );
    }

    if (cost === 0) {
        return (
            <span className={`${styles.badge} ${styles.blue}`}>
                FREE
            </span>
        );
    }

    return (
        <span className={`${styles.badge} ${styles.gray}`}>
            💸 ${cost.toFixed(3)}
        </span>
    );
}
