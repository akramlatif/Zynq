import { NextResponse } from 'next/server';

// Helper to simulate delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
    }

    // In a real application, we would proxy this multipart/form-data request
    // directly to our Express backend: POST http://localhost:5000/api/agent/voice
    // For this UI implementation phase, we mock the transcription delay and response.

    console.log(`Received audio file: ${audioFile.name}, size: ${audioFile.size} bytes`);

    // Simulate network and transcription delay (3 seconds)
    await delay(3000);

    const mockTranscription = "Mujhe inventory check karni hai.";
    
    // Mock Agent Logic based on transcription
    const intent = 'check_stock';
    const responseContent = 'Ji zaroor, yeh rahi low stock items ki list:';
    const data = {
      type: 'products',
      items: [
        { id: '1', name: 'Sugar', stock: 5, price: 140 },
        { id: '2', name: 'Flour 10kg', stock: 2, price: 1200 },
        { id: '3', name: 'Tea', stock: 1, price: 450 }
      ]
    };

    const agentMessage = {
      id: Date.now().toString(),
      role: 'agent',
      content: responseContent,
      timestamp: new Date().toISOString(),
      intent,
      data
    };

    return NextResponse.json({ 
      transcription: mockTranscription,
      message: agentMessage 
    });

  } catch (error) {
    console.error('Voice API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
