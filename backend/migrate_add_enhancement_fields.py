"""
Database migration: Add enhancement fields to trends table.
Run this once to add new columns for Phase 1 enhancements.
"""
from sqlalchemy import text
from db.database import engine

migration_sql = """
-- Temporal tracking
ALTER TABLE trends ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMP;
ALTER TABLE trends ADD COLUMN IF NOT EXISTS scrape_count INTEGER DEFAULT 1;
ALTER TABLE trends ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMP;
ALTER TABLE trends ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMP;
ALTER TABLE trends ADD COLUMN IF NOT EXISTS days_trending INTEGER DEFAULT 0;

-- Trend momentum
ALTER TABLE trends ADD COLUMN IF NOT EXISTS trend_velocity VARCHAR(20);
ALTER TABLE trends ADD COLUMN IF NOT EXISTS peak_score FLOAT;
ALTER TABLE trends ADD COLUMN IF NOT EXISTS peak_date TIMESTAMP;

-- Interest metrics
ALTER TABLE trends ADD COLUMN IF NOT EXISTS avg_interest INTEGER;
ALTER TABLE trends ADD COLUMN IF NOT EXISTS interest_peak INTEGER;
ALTER TABLE trends ADD COLUMN IF NOT EXISTS interest_delta FLOAT;

-- Temporal context
ALTER TABLE trends ADD COLUMN IF NOT EXISTS temporal_tags JSON;
ALTER TABLE trends ADD COLUMN IF NOT EXISTS emoji_tag VARCHAR(50);
ALTER TABLE trends ADD COLUMN IF NOT EXISTS urgency VARCHAR(20);

-- Cost tracking
ALTER TABLE trends ADD COLUMN IF NOT EXISTS scoring_cost FLOAT DEFAULT 0.0;
ALTER TABLE trends ADD COLUMN IF NOT EXISTS analysis_cost FLOAT DEFAULT 0.0;
ALTER TABLE trends ADD COLUMN IF NOT EXISTS total_api_cost FLOAT DEFAULT 0.0;

-- Validation & status
ALTER TABLE trends ADD COLUMN IF NOT EXISTS validation_status VARCHAR(30);
ALTER TABLE trends ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
"""

def run_migration():
    """Execute the migration."""
    try:
        with engine.connect() as conn:
            conn.execute(text(migration_sql))
            conn.commit()
            print("✅ Migration completed successfully!")
            print("Added enhancement fields to trends table.")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    print("Running migration: Add enhancement fields to trends table...")
    run_migration()
