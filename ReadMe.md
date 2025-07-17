# Microblog App

## Cara Menjalankan Project

### 1. Persiapan
- Pastikan sudah terinstall **Node.js** (minimal versi 16), **npm**, dan **MySQL** di komputer Anda.
- Clone repository ini dan masuk ke folder project.

### 2. Konfigurasi Environment
- Salin file `.env.example` (jika ada) menjadi `.env`, atau buat file `.env` baru.
- Isi variabel berikut sesuai konfigurasi MySQL Anda:

### 3. Install Dependency
```bash
npm install
```

### 4. Migrasi Database
npx sequelize-cli db:migrate

### 5. running aplikasi
```bash
npx nodemon app.js
```