import { useState } from 'react';
import { TrendFeed } from './pages/TrendFeed';
import { ShopifySEO } from './pages/ShopifySEO';
import { Orders } from './pages/Orders';
import { NicheExplorer } from './pages/NicheExplorer';
import './index.css';
import styles from './App.module.css';

type Page = 'trends' | 'seo' | 'orders' | 'explorer';

function App() {
  const [page, setPage] = useState<Page>('explorer');

  return (
    <div className={styles.app}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandLogo}>N</span>
          <span className={styles.brandName}>Novraux</span>
        </div>

        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${page === 'explorer' ? styles.active : ''}`}
            onClick={() => setPage('explorer')}
            id="nav-explorer"
          >
            <span className={styles.navIcon}>🔍</span>
            Niche Explorer
          </button>
          <button
            className={`${styles.navItem} ${page === 'trends' ? styles.active : ''}`}
            onClick={() => setPage('trends')}
            id="nav-trends"
          >
            <span className={styles.navIcon}>📈</span>
            Viral Trends
          </button>
          <button
            className={`${styles.navItem} ${page === 'seo' ? styles.active : ''}`}
            onClick={() => setPage('seo')}
            id="nav-seo"
          >
            <span className={styles.navIcon}>✦</span>
            Shopify SEO
          </button>
          <button
            className={`${styles.navItem} ${page === 'orders' ? styles.active : ''}`}
            onClick={() => setPage('orders')}
            id="nav-orders"
          >
            <span className={styles.navIcon}>📦</span>
            Orders
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <span className={styles.version}>v1.0 — Ready</span>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {page === 'explorer' && <NicheExplorer />}
        {page === 'trends' && <TrendFeed />}
        {page === 'seo' && <ShopifySEO />}
        {page === 'orders' && <Orders />}
      </main>
    </div>
  );
}

export default App;
