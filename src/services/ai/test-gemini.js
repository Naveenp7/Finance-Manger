const axios = require('axios');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = 'AIzaSyDOo3Iz3Ltns8YhuR4b6J0ZpaXCVXz_mQI';

(async () => {
  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: "Hello, Gemini!" }]
          }
        ]
      }
    );
    console.log(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
})();