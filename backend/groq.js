import axios from "axios";

const groqResponse = async (command, assistantName, userName) => {
  try {

    const prompt = `
You are a virtual assistant named ${assistantName} created by ${userName}. 
You are not Google. You behave like a voice-enabled assistant.

Respond ONLY in this JSON format:

{
  "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month" | "calculator-open" | "instagram-open" | "facebook-open" | "weather-show",
  "userInput": "<cleaned user input>",
  "response": "<short voice friendly reply>"
}

Rules:
- Only return JSON.
- No extra text.
- Keep response short.
- If asked who created you, say ${userName}.
- Remove assistant name from userInput if present.

Now user input: ${command}
`;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
       model: "llama-3.1-8b-instant",

        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const text = response.data.choices[0].message.content;

    // 🔥 Important: Parse JSON safely
    const cleaned = text.replace(/```json|```/g, "").trim();

    return JSON.parse(cleaned);

  } catch (error) {

    console.log("Groq Error:", error.response?.data || error.message);

    return {
      type: "general",
      userInput: command,
      response: "Sorry, something went wrong."
    };
  }
};

export default groqResponse;
