import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

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
    throw new Error(error.message || "Failed to communicate with AI");
  }
};

export const resetChat = () => {
  chatSession = null;
};
