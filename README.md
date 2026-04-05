# WMS Mobile

Aplikasi mobile Android untuk opname barang alat tulis kertas di gudang, dibangun dengan React Native 0.75.5.

---

## Fitur Utama

- **Dashboard** — Ringkasan statistik (total barang, lokasi planogram, produk tanpa lokasi).
- **Opname via Lokasi** — Cari lokasi planogram (LINE+RAK+SHELF+CELL), lihat isi storage, histori opname, dan update quantity.
- **Opname via Produk** — Cari produk (PRDCD / Nama), temukan semua lokasi penyimpanannya, dan update quantity.
- **Manajemen Profil** — Lihat informasi user dan status koneksi.
- **Keamanan** — Autentikasi JWT dengan fitur **Automatic Token Refresh** sebelum request ke backend.
- **Pembersihan Data** — Fitur untuk mengosongkan storage pada lokasi planogram tertentu.

---

## Struktur Direktori

```
WMS/
├── src/
│   ├── assets/           # Font, gambar & logo perusahaan
│   ├── components/       # Komponen UI reusable (Button, Input, LoadingView, dll)
│   ├── config/           # Konfigurasi API (Base URL & Gateway selection)
│   ├── constants/        # Global constants (Warna, Tipografi, Theme)
│   ├── navigation/       # Navigasi (AppStack, AuthStack, MainStack)
│   ├── service/          # API Services (Axios instances: imsApi & wmsApi)
│   ├── store/            # State Management (Zustand: authStore, opnameStore)
│   ├── utils/            # Utilities (Logger, Storage helper, Formatter)
│   └── screens/
│       ├── auth/login/   # Screen Login
│       └── main/
│           ├── home/     # Dashboard & Ringkasan
│           ├── opname/   # Fitur Opname (By Location & By Product)
│           └── profile/  # Informasi Akun User
├── App.js
├── .env                  # Environment variables (Dev / Prod)
└── package.json          # Dependencies & build scripts
├── App.js
├── .env                  # Environment variables
└── package.json
```

---

## Planogram

| Tipe  | Alamat                         |
| ----- | ------------------------------ |
| Rak   | Line (AA) → Rak → Shelf → Cell |
| Floor | Line (AA) → Loc                |

---

## Setup

### 1. Install dependensi

```bash
npm install
```

### 2. Android — link vector icons

Tambahkan ke `android/app/build.gradle`:

```gradle
apply from: "../../node_modules/@react-native-vector-icons/material-design-icons/fonts.gradle"
```

### 3. Setup environment

```bash
# Development
npm run env:dev

# Testing
npm run env:test

# Production
npm run env:prod
```

Edit `.env` sesuaikan `API_BASE_URL` ke alamat backend Anda.

### 4. Jalankan aplikasi

```bash
# Start Metro
npm start

# Jalankan di Android
npm run android
```

---

## Library yang Digunakan

| Library                                            | Kegunaan              |
| -------------------------------------------------- | --------------------- |
| `zustand`                                          | State management      |
| `axios`                                            | HTTP client           |
| `@react-navigation/native-stack`                   | Navigasi              |
| `@react-native-async-storage/async-storage`        | Penyimpanan lokal     |
| `@react-native-vector-icons/material-design-icons` | Icon                  |
| `react-native-logs`                                | Logging               |
| `react-native-config`                              | Environment variables |
| `react-native-paper`                               | UI provider / theme   |
| `react-native-safe-area-context`                   | Safe area insets      |

---

## API Endpoints

Aplikasi ini berinteraksi dengan dua prefix service utama:

### 1. IMS Service (Auth & Token)
- `POST /api-ims/auth/users/login` — Autentikasi user
- `POST /api-ims/auth/users/logout` — Logout user
- `GET  /api-ims/auth/users/profile` — Ambil data profil
- `GET  /api-ims/main/token/refresh` — Refresh expired JWT token

### 2. WMS Service (Opname & Planogram)
- `GET    /api-wmsmobile/main/atk/dashboard/summary` — Statistik dashboard
- `GET    /api-wmsmobile/main/atk/planogram/search` — Cari lokasi planogram
- `GET    /api-wmsmobile/main/atk/planogram/line/:id` — Detail lokasi & storage
- `GET    /api-wmsmobile/main/atk/opname/items/:id` — Histori opname per lokasi
- `DELETE /api-wmsmobile/main/atk/opname/clear-plano/:id` — Kosongkan storage lokasi
- `GET    /api-wmsmobile/main/atk/products` — Daftar produk untuk opname
- `GET    /api-wmsmobile/main/atk/opname/by-product/:prdcd` — Lokasi produk tertentu
- `POST   /api-wmsmobile/main/atk/opname/item` — Simpan data opname
- `POST   /api-wmsmobile/main/atk/planogram/storage` — Update qty storage langsung
