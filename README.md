# Media Downloader

Aplikasi web untuk mengunduh video dan audio dari **YouTube, Facebook, Instagram, TikTok, X (Twitter), dan Threads**.

## Fitur

- Mendeteksi platform secara otomatis dari link yang ditempel
- Menampilkan informasi media (judul, thumbnail, durasi, resolusi)
- Pilih resolusi video sebelum mengunduh (144p s.d. 2160p)
- Unduh audio sebagai MP3
- Streaming download langsung ke browser (tidak menyimpan file di server)

## Prasyarat

- **Node.js** v18+
- **Python** 3.8+ dengan **yt-dlp** terinstal
- **ffmpeg** (untuk konversi audio dan merge video+audio)

## Instalasi

```bash
# 1. Install dependencies Node.js
cd Downloader
npm install

# 2. Install yt-dlp
python -m pip install yt-dlp

# 3. Install ffmpeg (jika belum ada)
#   Windows: winget install "FFmpeg (Essentials Build)"
#   macOS:   brew install ffmpeg
#   Linux:   sudo apt install ffmpeg
```

## Menjalankan

```bash
npm start
```

Buka **http://localhost:3000** di browser.

## Cara Penggunaan

1. Tempel link video dari platform yang didukung
2. Klik **Get Media** — thumbnail, judul, dan daftar resolusi akan muncul
3. (Opsional) Klik salah satu chip resolusi untuk memilih kualitas
4. Klik **Download Video** atau **Download Audio**

## Struktur Proyek

```
Downloader/
├── index.html      # Frontend (single-page)
├── server.js       # Backend Express + yt-dlp
├── package.json    # Konfigurasi npm
└── README.md       # Dokumentasi
```

## API

### `POST /api/info`

Mengembalikan metadata media dari URL.

**Request:** `{ "url": "https://..." }`

**Response:** `{ title, thumbnail, duration, resolution, ext, formats[] }`

### `POST /api/download`

Mengunduh media dan mengirimkannya sebagai file.

**Request:** `{ "url": "...", "type": "video|audio", "format_id": "..." }`

- `format_id` hanya digunakan jika `type` adalah `"video"` dan pengguna memilih resolusi tertentu.

## Lisensi

MIT
