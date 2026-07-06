import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Audience } from "../types";

const MODEL_NAME = 'gemini-3-flash-preview';

// Initialize the client lazily
const getAiClient = () => {
  // Try Vite env first, then fallback to process.env for server-side if applicable
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : null) || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "null") {
    console.warn("Gemini API Key is missing. Operating in offline demo mode.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Simple mock replies for offline demo mode
const getMockResponse = (query: string, audience: Audience): string => {
  const lowerQuery = query.toLowerCase();
  
  if (audience === Audience.KIDS) {
    if (lowerQuery.includes("jesus") || lowerQuery.includes("love")) {
      return "Jesus loves you so much! He wants to be your forever friend and guide you every single day. 🌟❤️";
    }
    if (lowerQuery.includes("salvation") || lowerQuery.includes("christian") || lowerQuery.includes("abc") || lowerQuery.includes("save")) {
      return "Becoming a Christian is as easy as A-B-C! \n\n⭐ A: Admit you make mistakes.\n⭐ B: Believe Jesus died for you.\n⭐ C: Confess you want Him in your heart! ❤️";
    }
    return "Hi! I'm Faith Buddy! Remember that God created you for a wonderful purpose! Ask me anything about the Bible. 🦁✨";
  }
  
  if (audience === Audience.TEENS) {
    if (lowerQuery.includes("identity") || lowerQuery.includes("who am i")) {
      return "Your true identity is found in Christ. You are loved, chosen, and redeemed (Ephesians 1:7). Don't let the world define you!";
    }
    if (lowerQuery.includes("anxious") || lowerQuery.includes("stressed") || lowerQuery.includes("worry") || lowerQuery.includes("fear")) {
      return "Whenever you feel anxious, remember Philippians 4:6-7: present your requests to God, and His peace will guard your heart and mind in Christ Jesus.";
    }
    return "Yo! Tribe Mentor here. I'm currently running in offline demo mode (no API key configured), but I'm always ready to talk faith, life, and purpose. What's on your mind?";
  }
  
  // Teachers
  return "[Demo Mode] Ministry Co-Pilot: To enable live AI responses, please set the GEMINI_API_KEY environment variable in your Vercel project settings.\n\nHere is a quick outline for your lesson: Focus on soul-winning, include an interactive altar call, and encourage students to write down their prayer requests.";
};

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
    const ai = getAiClient();
    if (!ai) {
      // Simulate network delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 800));
      return getMockResponse(query, audience);
    }

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
    return getMockResponse(query, audience);
  }
};

/**
 * Generates a structured lesson plan or creative content.
 */
export const generateCreativeContent = async (
  topic: string,
  audience: Audience
): Promise<string> => {
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
        const ai = getAiClient();
        if (!ai) {
            await new Promise(resolve => setTimeout(resolve, 800));
            if (audience === Audience.TEACHERS) {
                return `### Redesigned Lesson Plan: ${topic}\n\n1. **Ice Breaker (5 mins)**: A game related to ${topic}.\n2. **The Gospel Message (15 mins)**: Explaining how Jesus paid for our sins.\n3. **Altar Call / ABCs (5 mins)**: Invite students to accept Jesus.\n4. **Follow-up (5 mins)**: Hands-on craft or group prayer.`;
            }
            return `Here is a creative thought about "${topic}": God has a plan for your life and wants you to share His love with others!`;
        }

        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text || "Content generation failed.";
    } catch (e) {
        console.error(e);
        if (audience === Audience.TEACHERS) {
            return `### Lesson Plan: ${topic} (Fallback)\n\n1. **Warm Up**: Introduce ${topic}.\n2. **Scripture**: Read relevant passages.\n3. **Prayer**: Commit the lesson to God.`;
        }
        return `Failed to generate content about "${topic}".`;
    }
}