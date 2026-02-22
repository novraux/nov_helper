# 💰 Revenue & Profit Dashboard

A comprehensive analytics hub that tracks sales, profit margins, and performance across all connected stores.

## 🛠 Features

### 1. Unified KPI Cards
- **Total Revenue**: Cumulative sales across Shopify & Etsy.
- **Net Profit**: Revenue minus estimated COGS (Cost of Goods Sold).
- **Orders**: Total transaction count.
- **Profit Margin**: Real-time margin percentage calculation.

### 2. 30-Day Performance Chart
- Interactive bar chart showing daily Revenue vs. Profit.
- Helps identify weekend trends and seasonal spikes.

### 3. Platform Breakdown
- Side-by-side comparison of **Shopify** vs. **Etsy**.
- See which channel is driving the highest volume vs. highest margin.

### 4. Top Products Leaderboard
- Rankings of your most profitable designs.
- Includes margin-efficiency bars to show which designs are "working hardest".

### 5. Enhanced Order Table
- Detailed transaction log with real-time margin % for every order.
- Color-coded badges for order status.

---

## 📂 Technical Implementation
- **Frontend**: `Orders.tsx`, `Orders.module.css` (using `Chart.js`)
- **Backend**: `routers/orders.py`
- **Data Model**: `Order` and `Product` models
