# 🗂 Design Vault

The Design Vault is your persistent library of AI-generated design concepts. It bridges the gap between research and production.

## 🛠 Features

### 1. Persistent Storage
- All designs saved from the **Niche Explorer** are stored in a PostgreSQL database.
- Includes concepts, elements, AI scores, and generated listing copy.

### 2. Workflow Management
- **Status Tracking**: Move designs from `Draft` → `Ready` → `Exported`.
- **Filtering**: Filter by Niche, Status, or Style to keep your production queue organized.

### 3. Quick Stats
- Global view of your total design assets and status distribution.

### 4. Listing Panel
- View and copy generated SEO titles, descriptions, and tags for each design without leaving the page.

### 5. Seamless Navigation
- Click a niche on any card to jump back to the **Niche Explorer** with that keyword pre-filled.

---

## 📂 Technical Implementation
- **Frontend**: `DesignVault.tsx`, `DesignVault.module.css`
- **Backend**: `routers/vault.py`
- **Database**: `SavedDesign` model in `db/models.py`
