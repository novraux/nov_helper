const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
    getTrends: async (params?: {
        min_score?: number;
        source?: string;
        ip_safe?: boolean;
        limit?: number;
    }) => {
        const query = new URLSearchParams();
        if (params?.min_score !== undefined) query.set('min_score', String(params.min_score));
        if (params?.source) query.set('source', params.source);
        if (params?.ip_safe !== undefined) query.set('ip_safe', String(params.ip_safe));
        if (params?.limit) query.set('limit', String(params.limit));

        const res = await fetch(`${API_BASE}/trends?${query}`);
        if (!res.ok) throw new Error('Failed to fetch trends');
        return res.json();
    },

    // Scraper is now triggered directly via EventSource in the component
    getTrend: async (id: number) => {
        const res = await fetch(`${API_BASE}/trends/${id}`);
        if (!res.ok) throw new Error('Failed to fetch trend');
        return res.json();
    },

    // Shopify Endpoints
    getShopifyProducts: async (limit: number = 50) => {
        const res = await fetch(`${API_BASE}/shopify/products?limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch Shopify products');
        return res.json();
    },

    generateProductSEO: async (productId: number, useSmartModel: boolean = false) => {
        const res = await fetch(
            `${API_BASE}/shopify/products/${productId}/generate-seo?use_smart_model=${useSmartModel}`,
            { method: 'POST' }
        );
        if (!res.ok) throw new Error('Failed to generate SEO');
        return res.json();
    },

    pushSEOToShopify: async (data: {
        product_id: number;
        seo_title: string;
        meta_description: string;
        tags?: string[];
        product_description?: string;
    }) => {
        const res = await fetch(`${API_BASE}/shopify/products/push-seo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to push SEO to Shopify');
        return res.json();
    },

    startBulkSEO: async (productIds?: number[], useSmartModel: boolean = false, autoPush: boolean = false) => {
        const res = await fetch(`${API_BASE}/shopify/products/bulk-seo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_ids: productIds, use_smart_model: useSmartModel, auto_push: autoPush }),
        });
        if (!res.ok) throw new Error('Failed to start bulk SEO');
        return res.json();
    },

    getBulkSEOResults: async (jobId: string) => {
        const res = await fetch(`${API_BASE}/shopify/bulk-seo/${jobId}`);
        if (!res.ok) throw new Error('Failed to fetch bulk SEO results');
        return res.json();
    },

    // Order Endpoints
    getOrders: async (limit: number = 50) => {
        const res = await fetch(`${API_BASE}/orders?limit=${limit}`);
        if (!res.ok) throw new Error('Failed to fetch orders');
        return res.json();
    },

    getOrderStats: async () => {
        const res = await fetch(`${API_BASE}/orders/stats`);
        if (!res.ok) throw new Error('Failed to fetch order stats');
        return res.json();
    },

    syncOrders: async () => {
        const res = await fetch(`${API_BASE}/orders/sync`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to trigger order sync');
        return res.json();
    },

    // Research Endpoints
    exploreNiche: async (keyword: string) => {
        const res = await fetch(`${API_BASE}/research/explore?keyword=${encodeURIComponent(keyword)}`, {
            method: 'POST'
        });
        if (!res.ok) throw new Error('Failed to explore niche');
        return res.json();
    },

    getCalendar: async () => {
        const res = await fetch(`${API_BASE}/research/calendar`);
        if (!res.ok) throw new Error('Failed to fetch calendar');
        return res.json();
    },

    // ── Design Vault ────────────────────────────────────────────────────────
    getVaultDesigns: async (filters?: { niche?: string; status?: string; style?: string }) => {
        const q = new URLSearchParams();
        if (filters?.niche) q.set('niche', filters.niche);
        if (filters?.status) q.set('status', filters.status);
        if (filters?.style) q.set('style', filters.style);
        const res = await fetch(`${API_BASE}/vault?${q}`);
        if (!res.ok) throw new Error('Failed to fetch vault');
        return res.json();
    },

    getVaultStats: async () => {
        const res = await fetch(`${API_BASE}/vault/stats`);
        if (!res.ok) throw new Error('Failed to fetch vault stats');
        return res.json();
    },

    saveDesign: async (design: {
        niche: string;
        title: string;
        concept?: string;
        design_text?: string;
        product_type?: string;
        style_preference?: string;
        demand_score?: number;
        elements?: string[];
        mockup_url?: string;
    }) => {
        const res = await fetch(`${API_BASE}/vault`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(design),
        });
        if (!res.ok) throw new Error('Failed to save design');
        return res.json();
    },

    updateDesignStatus: async (id: number, status: 'draft' | 'ready' | 'exported') => {
        const res = await fetch(`${API_BASE}/vault/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Failed to update design status');
        return res.json();
    },

    updateDesignListing: async (id: number, listing: {
        listing_title?: string;
        listing_description?: string;
        listing_tags?: string[];
    }) => {
        const res = await fetch(`${API_BASE}/vault/${id}/listing`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(listing),
        });
        if (!res.ok) throw new Error('Failed to update design listing');
        return res.json();
    },

    deleteDesign: async (id: number) => {
        const res = await fetch(`${API_BASE}/vault/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete design');
    },
};
