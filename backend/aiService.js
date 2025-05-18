const { GoogleGenAI } = require("@google/genai");
const fetch = require("node-fetch");

// Polyfill Fetch API globally
global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;

// Initialize the AI service
const initializeAI = () => {
  console.log('Gemini AI service initialized');

  // Check if the API key is available
  if (!process.env.GEMINI_API_KEY) {
    console.warn('Warning: GEMINI_API_KEY environment variable not set. API calls may fail.');
  }
};

// Function to get a response from the Gemini API
async function generateResponse(question) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Call the Gemini API with the user's question
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: question,
    });

    // Return the response text
    return {
      response: response.text.trim()
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    // Return a generic error response
    return {
      response: "I'm sorry, I couldn't process your request at the moment. Please try again later."
    };
  }
}

module.exports = {
  initializeAI,
  generateResponse
};