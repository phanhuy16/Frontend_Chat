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
  if (!text || !text.trim()) return text;

  try {
    // Using the public Google Translate API endpoint (gtx)
    // This is a common way to get translations in small projects without a full API key setup
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
    );

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Google Translate returns an array: [[["translated_text", "original_text", ...], ...], ...]
    if (data && data[0]) {
      const translatedParts = data[0].map((part: any) => part[0]);
      return translatedParts.join("");
    }

    return text;
  } catch (err) {
    console.error("Translation failed:", err);
    // Return original text on failure so the UI doesn't break
    return text;
  }
};
