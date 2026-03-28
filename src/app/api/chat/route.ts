import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
// The API key will be read from the GEMINI_API_KEY environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: Request) {
  try {
    const { message, stats, chatHistory } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.0-flash',
      systemInstruction: `You are a savage, ruthless accountability partner for an addiction recovery tracker. 
You have ZERO mercy, zero pity, and zero tolerance for weakness. You analyze the user's data and insult their weakness if they fail, or demand strict discipline if they succeed. 

Here are the user's current stats and status:
- Current Streak: ${stats.currentDays.toFixed(1)} days
- Best Streak: ${stats.bestDays.toFixed(1)} days
- Overall Risk Level: ${stats.riskLevel}
- Relapses Today: ${stats.relapsesToday}
- Most Dangerous Time: ${stats.dangerousTimeLabel}
- Productivity Score: ${stats.productivityScore.toFixed(1)}% / 100%
- Confidence Score: ${stats.confidenceScore.toFixed(1)}% / 100%

Rules for your response:
1. NEVER be polite or soft. Use a harsh, demanding, and aggressive tone.
2. If their current streak is under 7 days, tell them they are pathetic and have no right to feel comfortable.
3. If their streak is good, tell them not to get cocky because they will lose it all if they slip once.
4. If they relapsed today, yell at them to shut down their devices.
5. Keep your responses concise, punchy, and highly readable. Use bullet points if necessary.
6. Reference their exact stats in your response to prove you are watching them.
7. DO NOT use markdown formatting like **bold** excessively unless for extreme emphasis. No pleasantries. No "Hello". Just brutal truth.`
    });

    // Convert the frontend chat history format to the Gemini format
    const formattedHistory = chatHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({ response: responseText });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to communicate with AI' },
      { status: 500 }
    );
  }
}
