import { MENU_ITEMS } from './constants';

export async function sendMessageToAI(message: string, history: any[]) {
  const menuList = MENU_ITEMS.map(item => `- ${item.name} (${item.category}): ${item.description}`).join('\n');
  
  const tools = [
    {
      name: "add_item_to_cart",
      description: "Menambahkan menu ke keranjang. WAJIB panggil tool ini untuk setiap item baru.",
      parameters: {
        type: "OBJECT",
        properties: {
          itemId: { type: "STRING" },
          quantity: { type: "NUMBER" },
          option: { type: "STRING" },
          note: { type: "STRING" }
        },
        required: ["itemId"]
      }
    },
    {
      name: "finalize_order",
      description: "Menyelesaikan pesanan.",
      parameters: {
        type: "OBJECT",
        properties: {
          headcount: { type: "NUMBER" },
          orderType: { type: "STRING", enum: ['Makan di Tempat', 'Bungkus'] },
          paymentMethod: { type: "STRING", enum: ['Transfer', 'Tunai'] },
          overallNote: { type: "STRING" },
        },
        required: ["headcount", "orderType", "paymentMethod"],
      },
    },
    {
      name: "book_table",
      description: "Melakukan reservasi meja.",
      parameters: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          date: { type: "STRING" },
          time: { type: "STRING" },
          headcount: { type: "NUMBER" },
          note: { type: "STRING" },
        },
        required: ["name", "date", "time", "headcount"],
      },
    },
    {
      name: "clear_cart",
      description: "Menghapus semua isi keranjang.",
      parameters: { type: "OBJECT", properties: {} }
    },
    {
      name: "remove_item_from_cart",
      description: "Menghapus item tertentu dari keranjang.",
      parameters: {
        type: "OBJECT",
        properties: { itemId: { type: "STRING" } },
        required: ["itemId"]
      }
    }
  ];

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history: history.slice(-10).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      })),
      menuList,
      tools
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Gagal menghubungi koki AI");
  }

  return await response.json();
}
