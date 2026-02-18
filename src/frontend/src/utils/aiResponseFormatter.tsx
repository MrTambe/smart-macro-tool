/**
 * AI Response Formatter - formats AI responses for better display.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FormattedAIResponseProps {
  content: string;
  className?: string;
}

/**
 * Extract and format JSON code blocks from AI response
 */
export const formatAIResponse = (content: string): { text: string; codeBlocks: Array<{language: string; code: string}> } => {
  const codeBlocks: Array<{language: string; code: string}> = [];
  
  // Replace JSON code blocks with placeholders
  let formattedText = content.replace(/```json\n([\s\S]*?)\n```/g, (match, code) => {
    codeBlocks.push({ language: 'json', code: code.trim() });
    return '\n[JSON_BLOCK_' + (codeBlocks.length - 1) + ']\n';
  });
  
  // Replace other code blocks
  formattedText = formattedText.replace(/```(\w+)?\n([\s\S]*?)\n```/g, (match, lang, code) => {
    codeBlocks.push({ language: lang || 'text', code: code.trim() });
    return '\n[CODE_BLOCK_' + (codeBlocks.length - 1) + ']\n';
  });
  
  return { text: formattedText, codeBlocks };
};

/**
 * Component to render formatted AI response with markdown and code highlighting
 */
export const FormattedAIResponse: React.FC<FormattedAIResponseProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-invert prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          code({ node, inline, className: codeClassName, children, ...props }: any) {
            const match = /language-(\w+)/.exec(codeClassName || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            );
          },
          // Custom table styling
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-gray-800">{children}</thead>;
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="px-3 py-2 text-sm text-gray-300 border-b border-gray-700">{children}</td>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

/**
 * Extract actions from AI response with better formatting
 */
export const extractAIActions = (content: string): { cleanedContent: string; actions: any[] } => {
  const actions: any[] = [];
  let cleanedContent = content;
  
  // Try to find JSON action blocks
  const actionRegex = /```json\s*\n?\s*(\{[\s\S]*?(?:"type"\s*:\s*"(?:edit|format|create|delete|macro|suggestion)")[\s\S]*?\})\s*\n?```/g;
  let match;
  
  while ((match = actionRegex.exec(content)) !== null) {
    try {
      const action = JSON.parse(match[1]);
      actions.push({
        id: `${Date.now()}_${actions.length}`,
        ...action,
        approved: undefined
      });
      // Remove this block from content
      cleanedContent = cleanedContent.replace(match[0], '');
    } catch (e) {
      console.error('Failed to parse AI action:', e);
    }
  }
  
  // Also try without code blocks
  const inlineRegex = /(\{[\s\S]*?(?:"type"\s*:\s*"(?:edit|format|create|delete|macro|suggestion)")[\s\S]*?\})/g;
  while ((match = inlineRegex.exec(cleanedContent)) !== null) {
    try {
      const action = JSON.parse(match[1]);
      // Check if not already added
      if (!actions.find(a => JSON.stringify(a) === JSON.stringify({...action, id: undefined, approved: undefined}))) {
        actions.push({
          id: `${Date.now()}_${actions.length}`,
          ...action,
          approved: undefined
        });
        cleanedContent = cleanedContent.replace(match[0], '');
      }
    } catch (e) {
      // Not valid JSON, skip
    }
  }
  
  return { cleanedContent: cleanedContent.trim(), actions };
};

/**
 * Prettify JSON in AI response for display
 */
export const prettifyJSONInResponse = (content: string): string => {
  return content.replace(/```json\n([\s\S]*?)\n```/g, (match, jsonContent) => {
    try {
      const parsed = JSON.parse(jsonContent);
      return '```json\n' + JSON.stringify(parsed, null, 2) + '\n```';
    } catch (e) {
      return match;
    }
  });
};

export default FormattedAIResponse;
