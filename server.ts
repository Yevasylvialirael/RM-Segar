import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in the environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const tools = [
  {
    name: "add_item_to_cart",
    description: "Menambahkan menu ke keranjang belanja.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemId: { type: Type.STRING },
        quantity: { type: Type.NUMBER },
        option: { type: Type.STRING, enum: ["Es", "Panas"], description: "Suhu penyajian" },
        sweetness: { type: Type.STRING, enum: ["Manis", "Tawar", "Sedikit Gula"], description: "Tingkat kemanisan" },
        note: { type: Type.STRING }
      },
      required: ["itemId"]
    }
  },
  {
    name: "finalize_order",
    description: "Menyelesaikan pesanan. Gunakan jika keranjang sudah oke dan metode bayar dipilih.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        headcount: { type: Type.NUMBER },
        orderType: { type: Type.STRING },
        paymentMethod: { type: Type.STRING },
        overallNote: { type: Type.STRING },
      },
      required: ["headcount", "orderType", "paymentMethod"],
    },
  },
  {
    name: "book_table",
    description: "Melakukan reservasi meja.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        date: { type: Type.STRING },
        time: { type: Type.STRING },
        headcount: { type: Type.NUMBER },
        note: { type: Type.STRING },
      },
      required: ["name", "date", "time", "headcount"],
    },
  },
  {
    name: "clear_cart",
    description: "Menghapus semua isi keranjang.",
    parameters: { type: Type.OBJECT, properties: {} }
  },
  {
    name: "remove_item_from_cart",
    description: "Menghapus satu item dari keranjang.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        itemId: { type: Type.STRING }
      },
      required: ["itemId"]
    }
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  
  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, menuList, cart, isGuest } = req.body;
      const ai = getAI();
      
      const restrictedInstructions = `Anda adalah Master Panda, asisten kuliner RM Segar.
Tugas Anda adalah memberikan informasi seputar menu, jam operasional, dan lokasi RM Segar secara ramah.

Menu:
${menuList}

PENTING:
- Pelanggan saat ini adalah TAMU (belum login).
- Anda TIDAK BISA memproses pesanan atau reservasi. 
- Jika mereka bertanya cara pesan atau reservasi, arahkan mereka untuk LOGIN terlebih dahulu menggunakan tombol Profil di aplikasi.
- Gunakan emoji panda 🐼/bambu 🎋.`;

      const fullInstructions = `Anda adalah Master Panda, asisten kuliner RM Segar. 
Tugas Anda adalah melayani PESANAN MAKANAN atau RESERVASI MEJA.

Menu:
${menuList}

ISI KERANJANG SAAT INI (Berdasarkan Sistem):
${cart || 'Kosong'}

ALUR PESANAN MAKANAN:
1. TANYA HEADCOUNT: Berapa orang?
2. TANYA TIPE: Makan di Tempat atau Bungkus?
3. PILIH MENU: Berikan daftar menu. 
   - Panggil 'add_item_to_cart' HANYA JIKA pelanggan menyebutkan menu secara spesifik. 
   - JIKA pelanggan memberikan daftar banyak menu sekaligus, panggil 'add_item_to_cart' BERULANG KALI untuk setiap item tersebut dalam satu respon.
   - Untuk MINUMAN: Tanya Es/Hangat dan tingkat kemanisan (Manis, Tawar, atau Sedikit Gula).
4. KONFIRMASI KERANJANG: Setelah menambahkan item, SELALU tanya "Ada tambahan lagi menunya, Kak? Atau sudah cukup? 🐼🎋"
   - JIKA pelanggan menjawab "Cukup", "Sudah", atau "Selesai pilih menu", SEGERA LANJUT KE PEMBAYARAN. JANGAN mengulang daftar menu yang sama terus menerus.
5. PEMBAYARAN: Tanya metode bayar (Tunai/Transfer).
6. CATATAN: Tanya pesan koki. 
7. SELESAI: Panggil 'finalize_order' dengan parameter yang lengkap (termasuk headcount, orderType, paymentMethod yang sudah ditanyakan sebelumnya).

ALUR RESERVASI MEJA:
1. TANYA DETAIL: Mintalah Nama, Tanggal, Jam, dan Jumlah Orang.
2. TAWARKAN MENU: Tanya apakah ingin sekalian pesan makanan (pre-order) agar saat datang pesanan sudah siap.
3. KONFIRMASI: Tampilkan ringkasan reservasi (dan pesanan jika ada). Tanya sekali lagi apakah ada yang kurang.
4. SELESAI: Panggil 'book_table'.

Aturan:
- Gunakan emoji panda 🐼/bambu 🎋.
- Ramah, sopan, dan sigap membantu.
- PENTING: Selalu berikan respon teks meskipun Anda memanggil function call.
- Jika pengguna mengkonfirmasi sudah cukup, langsung tanyakan metode pembayaran.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          ...history,
          { role: "user", parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: isGuest ? restrictedInstructions : fullInstructions,
          tools: isGuest ? [] : [{ functionDeclarations: tools }]
        }
      });

      res.json({
        text: response.text,
        functionCalls: response.functionCalls
      });
    } catch (error: any) {
      console.error("Chat Error:", error);
      res.status(500).json({ error: error.message || "Something went wrong" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
