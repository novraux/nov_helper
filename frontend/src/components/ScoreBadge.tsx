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
