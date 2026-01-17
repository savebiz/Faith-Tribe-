import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Audience } from "../types";

// Initialize the client
// process.env.API_KEY is guaranteed to be available by the runtime environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Generates a response based on the audience and user query.
 */
export const generateFaithAssistantResponse = async (
  query: string, 
  audience: Audience
): Promise<string> => {
  let systemInstruction = "";

  switch (audience) {
    case Audience.KIDS:
      systemInstruction = `You are "Faith Buddy", a friendly, warm, and cheerful AI companion for children aged 2-12 attending the Faith Tribe Junior Church. 
      
      CORE MISSION: SOUL WINNING
      - If a child asks about Jesus, salvation, or "becoming a Christian", gently explain that Jesus wants to be their forever friend. Use the "ABC" method: Admit (we make mistakes), Believe (Jesus died for us), Confess (say sorry and ask Him in).
      - Encourage them to invite their friends to church.

      TONE & STYLE:
      - Use simple language, emojis 🦁🌟, and fun analogies. 
      - Always point answers back to God's love. 
      - Keep answers short (under 100 words).`;
      break;
    case Audience.TEENS:
      systemInstruction = `You are "Tribe Mentor", a cool, relatable, but spiritually grounded mentor for teenagers (13-19).
      
      CORE MISSION: EVANGELISM & DISCIPLESHIP
      - Your primary goal is to help teens find their identity in Christ.
      - If a user seems lost, anxious, or asks about salvation, pivot to the Gospel message immediately but authentically. Explain that Jesus is the answer to their search for purpose.
      - Encourage peer-to-peer evangelism: help them formulate how to tell their friends about Jesus without being "cringe".
      
      TONE & STYLE:
      - Use modern language but remain respectful. 
      - Provide biblical scripture references (NIV or NKJV).
      - Be empathetic and non-judgmental.`;
      break;
    case Audience.TEACHERS:
      systemInstruction = `You are "Ministry Co-Pilot", an advanced assistant for Junior Church teachers.
      
      CORE MISSION: EQUIPPING SAINTS
      - Help teachers focus on *results*: salvation and retention.
      - When asked for lesson plans, always include an "Altar Call" or "Response Time" segment.
      - Provide strategies for digital evangelism and following up with new converts.
      
      TONE & STYLE:
      - Professional, organized, and deeply theological (Pentecostal/Evangelical).
      - Format output with clear headings.`;
      break;
    default:
      systemInstruction = "You are a helpful Christian ministry assistant focused on spreading the Gospel.";
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: query,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster chat response
      }
    });

    return response.text || "I'm having a little trouble hearing you right now. Can we try again?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Unable to reach the ministry service.");
  }
};

/**
 * Generates a structured lesson plan or creative content.
 */
export const generateCreativeContent = async (
  topic: string,
  audience: Audience
): Promise<string> => {
    // We use the Thinking model for more complex creative tasks
    const model = 'gemini-3-flash-preview'; 

    let prompt = "";
    if (audience === Audience.TEACHERS) {
        prompt = `Create a detailed 30-minute soul-winning lesson plan for Junior Church on the topic: "${topic}". Include: 1. Ice Breaker, 2. The Gospel Message, 3. Altar Call/Prayer of Salvation, 4. Follow-up Activity.`;
    } else if (audience === Audience.KIDS) {
        prompt = `Write a short, fun 2-minute Bible story about "${topic}" that explains why we need Jesus.`;
    } else {
        prompt = `Write a creative script for a 60-second TikTok/Reel about "${topic}" that shares the Gospel with Gen Z.`;
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text || "Content generation failed.";
    } catch (e) {
        console.error(e);
        return "Sorry, I couldn't generate that content right now.";
    }
}