import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

const getAIClient = () => {
  if (!aiClient) {
    const apiKey = (process.env as any).GEMINI_API_KEY;
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export const tools: FunctionDeclaration[] = [
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

export async function chatWithPanda(
  message: string, 
  history: { role: string, parts: { text: string }[] }[],
  menuListString: string
) {
  const ai = getAIClient();
  
  // Sanitize history for Gemini (starts with user, alternates)
  const sanitizedHistory = [];
  let lastRole = "";
  for (const turn of history) {
    if (sanitizedHistory.length === 0) {
      if (turn.role === 'user') {
        sanitizedHistory.push(turn);
        lastRole = 'user';
      }
    } else {
      if (turn.role !== lastRole) {
        sanitizedHistory.push(turn);
        lastRole = turn.role;
      }
    }
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...sanitizedHistory,
      { role: "user", parts: [{ text: message }] }
    ],
    config: {
      systemInstruction: `Anda adalah Master Panda, asisten kuliner RM Segar. 
Tugas Anda adalah melayani PESANAN MAKANAN atau RESERVASI MEJA.

Menu:
${menuListString}

ALUR PESANAN MAKANAN:
1. TANYA HEADCOUNT: Berapa orang?
2. TANYA TIPE: Makan di Tempat atau Bungkus?
3. PILIH MENU: Berikan daftar menu. 
   - Panggil 'add_item_to_cart' HANYA JIKA pelanggan menyebutkan menu secara spesifik. 
   - JIKA pelanggan memberikan daftar banyak menu sekaligus, panggil 'add_item_to_cart' BERULANG KALI untuk setiap item tersebut dalam satu respon.
   - Untuk MINUMAN: Tanya Es/Hangat dan tingkat kemanisan (Manis, Tawar, atau Sedikit Gula).
4. KONFIRMASI KERANJANG: Setelah menambahkan item, SELALU tanya "Ada tambahan lagi menunya, Kak? Atau sudah cukup? 🐼🎋"
5. PEMBAYARAN: Tanya metode bayar (Tunai/Transfer).
6. CATATAN: Tanya pesan koki. 
7. SELESAI: Panggil 'finalize_order' dengan parameter yang lengkap.

ALUR RESERVASI MEJA:
1. TANYA DETAIL: Mintalah Nama, Tanggal, Jam, dan Jumlah Orang.
2. TAWARKAN MENU: Tanya apakah ingin sekalian pesan makanan (pre-order) agar saat datang pesanan sudah siap.
   - Jika YA: Ikuti alur PILIH MENU. Jangan lupa tanya apakah ada tambahan menu lagi sebelum lanjut.
   - Jika TIDAK: Lanjut ke konfirmasi.
3. KONFIRMASI: Tampilkan ringkasan reservasi (dan pesanan jika ada). Tanya sekali lagi apakah ada yang kurang.
4. SELESAI: Panggil 'book_table'.

Aturan:
- Gunakan emoji panda 🐼/bambu 🎋.
- Ramah, sopan, dan sigap membantu.
- PENTING: Selalu berikan respon teks (konfirmasi) meskipun Anda memanggil function call. Jangan mengosongkan respon teks.
- Jika pelanggan memberikan list menu (misal: "bakmie, mie goreng, teh manis"), panggil tool untuk ketiganya sekaligus.
- Setelah setiap penambahan menu, WAJIB bertanya apakah ada tambahan lagi.`,
      tools: [{ functionDeclarations: tools }]
    }
  });

  return {
    text: response.text,
    functionCalls: response.functionCalls
  };
}
