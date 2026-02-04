export const generateSmartReplies = (lastMessage: string): string[] => {
  const text = lastMessage.toLowerCase();

  // Questions
  if (text.includes("?")) {
    if (text.includes("how are you") || text.includes("khỏe không")) {
      return ["I'm good!", "Tôi khỏe, cảm ơn!", "Great! And you?"];
    }
    if (text.includes("where") || text.includes("ở đâu")) {
      return ["At home", "Ở nhà", "Working now"];
    }
    if (text.includes("when") || text.includes("khi nào")) {
      return ["In 10 mins", "Soon", "Tomorrow"];
    }
    return ["Yes", "No", "Maybe"];
  }

  // Greetings
  if (text.includes("hi") || text.includes("hello") || text.includes("chào")) {
    return ["Hi there!", "Hello!", "Chào bạn!"];
  }

  // Appreciation
  if (text.includes("thanks") || text.includes("thank you") || text.includes("cảm ơn")) {
    return ["You're welcome!", "Anytime!", "Không có gì!"];
  }

  // Default context-less
  return ["OK", "I'll check", "Got it!"];
};
