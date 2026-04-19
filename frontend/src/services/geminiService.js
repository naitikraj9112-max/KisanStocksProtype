import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY is not defined in .env. Please define it and restart the server.");
}

const genAI = new GoogleGenerativeAI(apiKey || "placeholder-to-prevent-crash");

// Using the flash model per instructions
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: "You are KisanBot, an expert agricultural AI assistant for Indian farmers answering questions about KisanStocks, crop yield prediction, soil health, farming practices, and weather impacts. Be concise, highly helpful, and respond in the same language as the user's query (English or Hindi). Avoid markdown formats that are too complex, stick to bullet points and paragraphs."
});

let chatSession = null;

export const sendMessage = async (prompt) => {
  try {
    if (!chatSession) {
      chatSession = model.startChat({
        history: [],
      });
    }

    const result = await chatSession.sendMessage(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    let errMsg = error.message || "Failed to communicate with AI";
    if (errMsg.includes("API key not valid")) {
      errMsg = "API Key is invalid. Please check your .env file.";
    }
    throw new Error(errMsg);
  }
};

export const resetChat = () => {
  chatSession = null;
};
