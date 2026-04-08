# Panduan Deployment ke GitHub Pages

Untuk mengonlinekan aplikasi ini di GitHub Pages, ikuti langkah-langkah berikut:

1. **Buat Repositori di GitHub**:
   - Buat repositori baru di GitHub (misalnya: `rm-segar`).

2. **Inisialisasi Git di Komputer Anda**:
   Buka terminal di folder proyek ini dan jalankan:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. **Hubungkan ke GitHub**:
   Ganti `<USERNAME>` dan `<REPO-NAME>` dengan data Anda:
   ```bash
   git remote add origin https://github.com/<USERNAME>/<REPO-NAME>.git
   git branch -M main
   git push -u origin main
   ```

4. **Jalankan Perintah Deploy**:
   ```bash
   npm run deploy
   ```

5. **Aktifkan GitHub Pages**:
   - Pergi ke tab **Settings** di repositori GitHub Anda.
   - Pilih **Pages** di menu sebelah kiri.
   - Pastikan **Source** diatur ke `Deploy from a branch`.
   - Pilih branch `gh-pages` dan folder `/ (root)`.
   - Klik **Save**.

Aplikasi Anda akan segera online di `https://<USERNAME>.github.io/<REPO-NAME>/`.
