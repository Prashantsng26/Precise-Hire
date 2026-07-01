/**
 * Cleans the input text by identifying the start of a JSON object/array
 * and finding its corresponding closing bracket.
 * 
 * @param {string} text - Raw output from AI model
 * @returns {string} - Cleaned JSON string or the original trimmed text if no match found
 */
export function cleanJSON(text) {
  if (typeof text !== 'string') return '';
  text = text.trim();
  
  // Find the first occurrence of { or [
  const startObj = text.indexOf('{');
  const startArr = text.indexOf('[');
  
  let start = -1;
  let end = -1;
  let bracketType = '';

  if (startObj !== -1 && (startArr === -1 || startObj < startArr)) {
    start = startObj;
    bracketType = '{';
  } else if (startArr !== -1) {
    start = startArr;
    bracketType = '[';
  }

  if (start === -1) return text;

  // Simple bracket matcher to find the matching closing bracket
  const closingType = bracketType === '{' ? '}' : ']';
  let stack = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === bracketType) {
      stack++;
    } else if (text[i] === closingType) {
      stack--;
      if (stack === 0) {
        end = i;
        break;
      }
    }
  }

  if (start !== -1 && end !== -1) {
    return text.substring(start, end + 1);
  }
  
  return text;
}

/**
 * Parses the AI text response to JSON, extracting the JSON structure first.
 * Throws an error if text is empty, not a string, or contains invalid/unparseable JSON.
 * 
 * @param {string} text - AI model response
 * @returns {Object|Array} - Parsed JSON object or array
 */
export function parseAIResponse(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('AI response is empty or not a string');
  }

  const cleaned = cleanJSON(text);
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    throw new Error(`Failed to parse AI response as JSON: ${error.message}. Cleaned text: "${cleaned}"`);
  }
}
