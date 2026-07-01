import { cleanJSON, parseAIResponse } from '../utils/aiParser.js';

describe('aiParser.js', () => {
  describe('cleanJSON', () => {
    test('should extract pure JSON object correctly', () => {
      const text = '{"role": "Developer", "score": 90}';
      expect(cleanJSON(text)).toBe('{"role": "Developer", "score": 90}');
    });

    test('should extract JSON object surrounded by conversational text', () => {
      const text = 'Here is the result: {"role": "Designer", "score": 85} Hope this helps!';
      expect(cleanJSON(text)).toBe('{"role": "Designer", "score": 85}');
    });

    test('should extract JSON array surrounded by markdown code blocks', () => {
      const text = '```json\n[{"index": 0, "role": "Data Scientist"}]\n```';
      expect(cleanJSON(text)).toBe('[{"index": 0, "role": "Data Scientist"}]');
    });

    test('should handle nested brackets correctly', () => {
      const text = 'Response: {"user": {"details": {"name": "Bob"}}, "active": true}';
      expect(cleanJSON(text)).toBe('{"user": {"details": {"name": "Bob"}}, "active": true}');
    });

    test('should return trimmed original text if no brackets are found', () => {
      expect(cleanJSON('No JSON here')).toBe('No JSON here');
      expect(cleanJSON('   ')).toBe('');
    });

    test('should return empty string if input is not a string', () => {
      expect(cleanJSON(null)).toBe('');
      expect(cleanJSON(undefined)).toBe('');
      expect(cleanJSON(123)).toBe('');
    });
  });

  describe('parseAIResponse', () => {
    test('should successfully parse valid JSON object embedded in text', () => {
      const text = 'Some prefix text: {"status": "ok", "count": 5} some suffix text';
      const result = parseAIResponse(text);
      expect(result).toEqual({ status: 'ok', count: 5 });
    });

    test('should successfully parse valid JSON array embedded in text', () => {
      const text = 'Results: [{"id": 1}, {"id": 2}]';
      const result = parseAIResponse(text);
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });

    test('should throw an error for empty or non-string input', () => {
      expect(() => parseAIResponse(null)).toThrow('AI response is empty or not a string');
      expect(() => parseAIResponse('')).toThrow('AI response is empty or not a string');
      expect(() => parseAIResponse(undefined)).toThrow('AI response is empty or not a string');
    });

    test('should throw an error for unparseable malformed JSON text', () => {
      const text = 'Here is some malformed JSON: {"role": "Dev", "score": }';
      expect(() => parseAIResponse(text)).toThrow('Failed to parse AI response as JSON');
    });

    test('should throw an error if no JSON structures are found in text', () => {
      const text = 'This is just a plain conversational text without brackets.';
      expect(() => parseAIResponse(text)).toThrow('Failed to parse AI response as JSON');
    });
  });
});
