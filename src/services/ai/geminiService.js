import axios from 'axios';

// Replace with your Gemini API endpoint and key
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const GEMINI_API_KEY = 'AIzaSyDX59pZ720xLrOVlm53ZIpKtLNnMZtpK_8Y'; // For demo only, do not expose in production

export async function askGemini(query, transactions) {
  try {
    const context = `Transaction Data: ${JSON.stringify(transactions).slice(0, 4000)}`;
    const prompt = `${context}\nUser Query: ${query}`;
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      }
    );
    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';
  } catch (err) {
    return 'Error contacting Gemini API.';
  }
}
