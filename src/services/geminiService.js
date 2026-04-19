const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

if (!apiKey) {
  console.error("VITE_OPENROUTER_API_KEY is not defined in .env. Please define it and restart the server.");
}

const SYSTEM_PROMPT = "You are KisanBot, an expert agricultural AI assistant for Indian farmers answering questions about KisanStocks, crop yield prediction, soil health, farming practices, and weather impacts. Be concise, highly helpful, and respond in the same language as the user's query (English or Hindi). Avoid markdown formats that are too complex, stick to bullet points and paragraphs.";

let chatHistory = [];

export const sendMessage = async (prompt) => {
  try {
    if (chatHistory.length === 0) {
      chatHistory.push({ role: "system", content: SYSTEM_PROMPT });
    }

    chatHistory.push({ role: "user", content: prompt });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini", // OpenRouter model route
        messages: chatHistory,
      })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[${response.status}] ${errorText}`);
    }

    const data = await response.json();
    const resultText = data.choices[0].message.content;
    
    chatHistory.push({ role: "assistant", content: resultText });
    
    return resultText;
  } catch (error) {
    console.error("OpenRouter API Error:", error);
    let errMsg = error.message || "Failed to communicate with AI";
    if (errMsg.includes("401")) {
      errMsg = "API Key is invalid. Please check your .env file.";
    }
    // Remove the last user message so they can try again
    chatHistory.pop();
    throw new Error(errMsg);
  }
};

export const resetChat = () => {
  chatHistory = [];
};
