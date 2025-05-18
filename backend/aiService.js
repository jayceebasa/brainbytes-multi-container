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
async function generateResponse(question, subject = "General") {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Create a subject-specific prompt based on the selected filter
    let enhancedPrompt = question;
    if (subject && subject !== "General") {
      enhancedPrompt = `You are an expert tutor specializing in ${subject}. 
Please provide a comprehensive, ${subject}-focused response to this question: ${question}
Make sure your answer thoroughly incorporates ${subject} concepts, terminology, and relevant examples. Give concise and clear explanations. Only give long answers if absolutely necessary.`;
    }

    // Call the Gemini API with the enhanced prompt
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: enhancedPrompt,
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