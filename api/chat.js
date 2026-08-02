import fs from 'fs';
import path from 'path';

// Define the API route handler
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Load portfolio.md as the knowledge base
    // process.cwd() points to the root of the project in Vercel
    const portfolioPath = path.join(process.cwd(), 'portfolio.md');
    let systemInstruction = "You are KanishkGPT, the personal AI assistant of Kanishk Gupta. You answer questions about his portfolio and persona.";
    
    try {
      const fileContent = fs.readFileSync(portfolioPath, 'utf8');
      systemInstruction = fileContent;
    } catch (err) {
      console.error('Error reading portfolio.md:', err);
      // Fallback is already set
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error: API key missing' });
    }

    // Format history for Gemini
    // Gemini expects contents array with { role: "user" | "model", parts: [{ text: "..." }] }
    const formattedHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Append the new message
    formattedHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: formattedHistory,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Failed to generate response' });
    }

    // Extract the AI response
    let aiResponseText = "";
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
        aiResponseText = data.candidates[0].content.parts[0].text;
    } else {
        throw new Error('Unexpected response format from Gemini');
    }

    return res.status(200).json({ response: aiResponseText });

  } catch (error) {
    console.error('Chatbot API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
