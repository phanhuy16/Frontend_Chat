/**
 * Mock Translation Service
 * In a real app, this would call an API like Google Translate or DeepL.
 */

const MOCK_TRANSLATIONS: Record<string, string> = {
  "Hello": "Xin chào",
  "How are you?": "Bạn khỏe không?",
  "I am doing well.": "Tôi khỏe.",
  "What's up?": "Có chuyện gì thế?",
  "Good morning": "Chào buổi sáng",
  "Good night": "Chúc ngủ ngon",
  "Thank you": "Cảm ơn bạn",
  "Draft": "Bản nháp",
};

export const translateText = async (text: string, targetLang: string = "vi"): Promise<string> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // For mock purposes, if we have it in our dictionary, return it
  // Otherwise, just append a mock suffix to simulate a translation
  if (MOCK_TRANSLATIONS[text]) {
    return MOCK_TRANSLATIONS[text];
  }

  if (targetLang === "vi") {
    return `[Dịch] ${text} (Bản dịch mô phỏng)`;
  }
  
  return `[Translated] ${text}`;
};
