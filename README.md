# 🛍️ ShopNear

**A hyperlocal shop discovery platform connecting neighborhood consumers with real local shops.**

ShopNear is NOT a delivery app — it connects you with kirana stores, bakeries, and vegetable vendors so you can check product availability and prices before physically visiting.

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | React Native (Expo) |
| Web Portal | Next.js (App Router) |
| Backend API | Node.js + Express |
| Database | MySQL |
| Auth | JWT (JSON Web Tokens) |

## 📂 Project Structure

```
ShopNear/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── config/       # Database config
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/    # Auth middleware
│   │   ├── routes/       # API routes
│   │   └── server.js     # Entry point
│   └── database/
│       └── schema.sql    # MySQL schema + seed data
├── web/              # Next.js Web Portal
│   └── src/
│       ├── app/          # App Router pages
│       ├── components/   # Shared components
│       └── lib/          # API client
├── mobile/           # React Native (Expo) App
│   └── src/
│       ├── screens/      # App screens
│       ├── constants/    # Theme/design tokens
│       └── services/     # API service layer
```

## 🚀 Quick Start

### 1. Backend

```bash
cd backend
npm install

# Set up MySQL database
mysql -u root < database/schema.sql

# Configure .env (update DB credentials)
# Start server
npm run dev
```

The API runs at `http://localhost:5000`

### 2. Web Portal (Next.js)

```bash
cd web
npm install
npm run dev
```

The web portal runs at `http://localhost:3000`

### 3. Mobile App (Expo)

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go app.

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (customer/vendor) |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/profile` | Get user profile |
| GET | `/api/shops/all` | List all shops |
| GET | `/api/shops/nearby?lat=&lng=` | Nearby shops (GPS) |
| GET | `/api/shops/:id/products` | Shop products |
| GET | `/api/shops/search?q=` | Search products |
| GET | `/api/vendor/dashboard` | Vendor dashboard stats |
| POST | `/api/vendor/products` | Add product |
| PUT | `/api/vendor/products/:id` | Update product |
| DELETE | `/api/vendor/products/:id` | Delete product |
| GET | `/api/vendor/orders` | Vendor orders |
| PUT | `/api/vendor/orders/:id/status` | Update order status |

## 🎨 Design Theme

- **Primary Purple**: `#7B2FBE`
- **Light Lavender**: `#F3EEFF`
- **Dark Purple Text**: `#3D1270`
- **Success Teal**: `#2DD4BF`
- **Font**: Inter / Poppins
- **Border Radius**: 999px (pills), 16px (cards)

## 📱 Screens

### Mobile (React Native)
1. **Welcome Screen** — Splash with shop illustration
2. **Login Screen** — Pill inputs + arrow CTA + social login
3. **Sign Up Screen** — Dual role signup (Customer/Vendor)
4. **Customer Home** — Browse, search, category filter, product grid
5. **Vendor Dashboard** — Stats, fulfillment chart, quick actions

### Web (Next.js)
1. **Landing Page** — Hero + features + how-it-works + CTA
2. **Login / Sign Up** — Matching mobile design
3. **Browse Shops** — Search, categories, product grid
4. **Vendor Dashboard** — Stats, chart, quick actions
5. **Product Management** — Table with add/edit/delete modal
6. **Order Management** — Order cards with status workflow

## 📄 License

MIT
