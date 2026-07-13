import { NextResponse } from 'next/server';

// In a real application, this would integrate with the actual backend service
// powered by Gemini and Drizzle ORM. For this phase, we mock the responses.

// Helper to simulate delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET() {
  // Return some initial mock history to simulate a returning user
  const initialHistory = [
    {
      id: 'mock-1',
      role: 'agent',
      content: 'Hello! I am your Zynq assistant. How can I help you with your shop today?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    }
  ];

  return NextResponse.json({ messages: initialHistory });
}

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Simulate network delay for typing indicator
    await delay(1500);

    const lowerMsg = message.toLowerCase();
    
    // Mock Agent Logic
    let responseContent = 'I can help with that. Please tell me more.';
    let intent: string | undefined = 'unknown';
    let data: any = undefined;

    if (lowerMsg.includes('bill') || lowerMsg.includes('receipt')) {
      intent = 'generate_bill';
      responseContent = 'Here is the bill draft. Should I execute it?';
      data = {
        type: 'bill',
        customer: 'Ali Ahmad',
        items: [
          { name: 'Rice 5kg', qty: 1, price: 1500 },
          { name: 'Cooking Oil', qty: 2, price: 900 }
        ],
        total: 3300
      };
    } else if (lowerMsg.includes('stock') || lowerMsg.includes('products') || lowerMsg.includes('inventory')) {
      intent = 'check_stock';
      responseContent = 'Here are the current low stock products:';
      data = {
        type: 'products',
        items: [
          { id: '1', name: 'Sugar', stock: 5, price: 140 },
          { id: '2', name: 'Flour 10kg', stock: 2, price: 1200 },
          { id: '3', name: 'Tea', stock: 1, price: 450 }
        ]
      };
    } else if (lowerMsg.includes('add') || lowerMsg.includes('new product')) {
      intent = 'add_product';
      responseContent = 'Got it, I will add this to the inventory.';
    }

    const agentMessage = {
      id: Date.now().toString(),
      role: 'agent',
      content: responseContent,
      timestamp: new Date().toISOString(),
      intent,
      data
    };

    return NextResponse.json({ message: agentMessage });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
