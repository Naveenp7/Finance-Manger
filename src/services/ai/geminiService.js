import axios from 'axios';

// Correct Gemini API endpoint and key usage
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = 'AIzaSyDOo3Iz3Ltns8YhuR4b6J0ZpaXCVXz_mQI'; // For demo only, do not expose in production

export async function askGemini(query) {
  try {
    // Send only the user query for minimal payload troubleshooting
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: query }]
          }
        ]
      }
    );
    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI.';
  } catch (err) {
    return 'Error contacting Gemini API.';
  }
}
