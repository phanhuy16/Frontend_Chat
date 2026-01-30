/**
 * Rich Text Parser Utility
 * Parses markdown-like syntax and converts to React elements
 * Supports: **bold**, *italic*, `inline code`, ```code blocks```
 */

import React, { ReactNode } from 'react';

interface ParsedSegment {
  type: 'text' | 'bold' | 'italic' | 'code' | 'codeblock';
  content: string;
}

/**
 * Parse text content and return React elements with formatting
 */
export function parseRichText(text: string): ReactNode {
  if (!text) return null;

  const segments: ParsedSegment[] = [];
  let remaining = text;

  // Process code blocks first (```)
  while (remaining.length > 0) {
    const codeBlockMatch = remaining.match(/```([\s\S]*?)```/);
    
    if (codeBlockMatch && codeBlockMatch.index !== undefined) {
      // Add text before code block
      if (codeBlockMatch.index > 0) {
        segments.push(...parseInlineFormatting(remaining.substring(0, codeBlockMatch.index)));
      }
      // Add code block
      segments.push({ type: 'codeblock', content: codeBlockMatch[1].trim() });
      remaining = remaining.substring(codeBlockMatch.index + codeBlockMatch[0].length);
    } else {
      // No more code blocks, parse remaining as inline
      segments.push(...parseInlineFormatting(remaining));
      break;
    }
  }

  return segments.map((segment, index) => renderSegment(segment, index));
}

/**
 * Parse inline formatting: **bold**, *italic*, `code`
 */
function parseInlineFormatting(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  let remaining = text;

  // Combined regex for all inline patterns
  const inlinePattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/;

  while (remaining.length > 0) {
    const match = remaining.match(inlinePattern);

    if (match && match.index !== undefined) {
      // Add text before match
      if (match.index > 0) {
        segments.push({ type: 'text', content: remaining.substring(0, match.index) });
      }

      // Determine type and add formatted segment
      if (match[2]) {
        // **bold**
        segments.push({ type: 'bold', content: match[2] });
      } else if (match[3]) {
        // *italic*
        segments.push({ type: 'italic', content: match[3] });
      } else if (match[4]) {
        // `code`
        segments.push({ type: 'code', content: match[4] });
      }

      remaining = remaining.substring(match.index + match[0].length);
    } else {
      // No more patterns, add remaining text
      if (remaining) {
        segments.push({ type: 'text', content: remaining });
      }
      break;
    }
  }

  return segments;
}

/**
 * Render a parsed segment to React element
 */
function renderSegment(segment: ParsedSegment, key: number): ReactNode {
  switch (segment.type) {
    case 'bold':
      return (
        <strong key={key} className="rich-text-bold">
          {segment.content}
        </strong>
      );
    case 'italic':
      return (
        <em key={key} className="rich-text-italic">
          {segment.content}
        </em>
      );
    case 'code':
      return (
        <code key={key} className="rich-text-inline-code">
          {segment.content}
        </code>
      );
    case 'codeblock':
      return (
        <pre key={key} className="rich-text-code-block">
          <code>{segment.content}</code>
        </pre>
      );
    default:
      return <React.Fragment key={key}>{segment.content}</React.Fragment>;
  }
}

/**
 * Check if text contains any rich text formatting
 */
export function hasRichTextFormatting(text: string): boolean {
  if (!text) return false;
  return /(\*\*|`{1,3}|\*)/.test(text);
}
