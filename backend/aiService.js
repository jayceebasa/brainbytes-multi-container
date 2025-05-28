require("dotenv").config(); // Load environment variables from .env file
const { InferenceClient } = require("@huggingface/inference");
const fetch = require("node-fetch");

// Polyfill Fetch API globally
global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;

// Initialize the AI service
const initializeAI = () => {
  console.log("Hugging Face AI service initialized");

  if (!process.env.HUGGINGFACE_TOKEN) {
    console.warn("Warning: HUGGINGFACE_TOKEN environment variable not set. API calls may fail.");
  }
};

// Function to get response from Hugging Face conversational model
async function generateResponse(question, subject = "General") {
  try {
    const client = new InferenceClient(process.env.HUGGINGFACE_TOKEN);

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

    // Call the Hugging Face API with the enhanced prompt
    const chatCompletion = await client.chatCompletion({
      provider: "nebius",
      model: "deepseek-ai/DeepSeek-V3-0324",
      messages: [
        {
          role: "user",
          content: enhancedPrompt,
        },
      ],
    });

    if (chatCompletion && chatCompletion.choices && chatCompletion.choices[0]) {
      return {
        category: "open-ended",
        response: chatCompletion.choices[0].message.content.trim(),
      };
    } else {
      return {
        category: "error",
        response: "I'm sorry, I couldn't understand your question. Please try again.",
      };
    }
  } catch (error) {
    console.error("Error calling Hugging Face API:", error);
    return {
      category: "error",
      response: "I'm sorry, something went wrong. Please try again later.",
    };
  }
}

module.exports = {
  initializeAI,
  generateResponse,
};