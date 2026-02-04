import { jsPDF } from "jspdf";
import { Message } from "../types";
import { format } from "date-fns";

export const exportToText = (messages: Message[], conversationName: string) => {
  let content = `Chat History: ${conversationName}\n`;
  content += `Exported on: ${new Date().toLocaleString()}\n`;
  content += `------------------------------------------\n\n`;

  messages.forEach((msg) => {
    const time = format(new Date(msg.createdAt), "yyyy-MM-dd HH:mm:ss");
    content += `[${time}] ${msg.sender.displayName}: ${msg.content}\n`;
  });

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `chat_history_${conversationName.replace(/\s+/g, "_")}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportToPDF = (messages: Message[], conversationName: string) => {
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(16);
  doc.text(`Chat History: ${conversationName}`, 10, y);
  y += 10;
  doc.setFontSize(10);
  doc.text(`Exported on: ${new Date().toLocaleString()}`, 10, y);
  y += 10;
  doc.line(10, y, 200, y);
  y += 10;

  messages.forEach((msg) => {
    const time = format(new Date(msg.createdAt), "yyyy-MM-dd HH:mm:ss");
    const text = `[${time}] ${msg.sender.displayName}: ${msg.content}`;

    // Simple text wrapping
    const lines = doc.splitTextToSize(text, 180);

    if (y + lines.length * 5 > 280) {
      doc.addPage();
      y = 20;
    }

    doc.text(lines, 10, y);
    y += lines.length * 5 + 2;
  });

  doc.save(`chat_history_${conversationName.replace(/\s+/g, "_")}.pdf`);
};
