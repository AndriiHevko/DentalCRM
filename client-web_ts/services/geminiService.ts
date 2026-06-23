import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const SYSTEM_INSTRUCTION = `
Ти — віртуальний асистент сучасної стоматологічної клініки "Dental".
Твоє завдання — ввічливо та професійно відповідати на запитання пацієнтів українською мовою.

Твої обов'язки:
1. Консультувати щодо загальних послуг (чистка, пломбування, відбілювання, імплантація).
2. Пояснювати важливість гігієни ротової порожнини.
3. Орієнтувати по цінах (використовуй діапазони: чистка від 1500 грн, пломба від 1200 грн, імплант від 15000 грн).
4. Завжди нагадувати, що ти ШІ, і для точного діагнозу потрібен огляд лікаря.

Заборони:
- Не став діагнози.
- Не призначай ліки.
- Не гарантуй результат лікування без огляду.

Тон спілкування: Доброзичливий, заспокійливий, професійний.
`;

let chatSession: Chat | null = null;

export const initializeChat = (): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });
  return chatSession;
};

export const sendMessageToGemini = async (message: string, chat?: Chat): Promise<string> => {
  try {
    const currentChat = chat || chatSession || initializeChat();

    const response: GenerateContentResponse = await currentChat.sendMessage({
      message
    });

    if (response.text) {
      return response.text;
    }

    return "Вибачте, я не зміг отримати відповідь. Спробуйте ще раз.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Виникла технічна помилка. Будь ласка, зателефонуйте адміністратору.";
  }
};