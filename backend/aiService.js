const { GoogleGenAI } = require("@google/genai");
const fetch = require("node-fetch");

// Polyfill Fetch API globally
global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;

// Initialize the AI service
const initializeAI = () => {
  console.log("Gemini AI service initialized");

  // Check if the API key is available
  if (!process.env.GEMINI_API_KEY) {
    console.warn("Warning: GEMINI_API_KEY environment variable not set. API calls may fail.");
  }
};

async function generateResponse(question, subject = "General") {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Create a subject-specific prompt based on the selected filter
    let enhancedPrompt = question;
    if (subject && subject !== "General") {
      enhancedPrompt = `You are a friendly tutor who specializes in ${subject}. 
Please answer this question in a conversational way: ${question}

Guidelines:
- Use a warm, casual tone like you're talking to a student face-to-face
- Avoid using asterisks, bullet points, or other formatting symbols
- Write in simple, flowing paragraphs rather than structured lists
- Explain concepts in plain language a student would understand
- Keep your answer concise but helpful`;
    } else {
      enhancedPrompt = `You are a friendly tutor. Please answer this question in a conversational way: ${question}

Guidelines:
- Use a warm, casual tone like you're talking to a student face-to-face
- Avoid using asterisks, bullet points, or other formatting symbols
- Write in simple, flowing paragraphs rather than structured lists
- Explain concepts in plain language a student would understand
- Keep your answer concise but helpful`;
    }

    // Call the Gemini API with the enhanced prompt
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: enhancedPrompt,
    });

    // Return the response text
    return {
      response: response.text.trim(),
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);

    // Return a generic error response
    return {
      response: "I'm sorry, I couldn't process your request at the moment. Please try again later.",
    };
  }
}

module.exports = {
  initializeAI,
  generateResponse,
};
