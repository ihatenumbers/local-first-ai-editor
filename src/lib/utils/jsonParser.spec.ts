import { describe, it, expect } from 'vitest';
import { extractJsonFromText } from './jsonParser';

describe('extractJsonFromText', () => {
    it('parses valid JSON object directly', () => {
        expect(extractJsonFromText('{"hello":"world"}')).toEqual({ hello: 'world' });
    });

    it('parses valid JSON array directly', () => {
        expect(extractJsonFromText('[{"hello":"world"}]')).toEqual([{ hello: 'world' }]);
    });

    it('extracts JSON from standard markdown block', () => {
        const markdown = "Here is your JSON:\n```json\n{\"test\": 123}\n```";
        expect(extractJsonFromText(markdown)).toEqual({ test: 123 });
    });

    it('extracts JSON from untagged markdown block', () => {
        const markdown = "Here it is:\n```\n[{\"test\": 123}]\n```";
        expect(extractJsonFromText(markdown)).toEqual([{ test: 123 }]);
    });

    it('extracts JSON from unclosed markdown block', () => {
        const markdown = "```json\n{\"test\": 123}";
        expect(extractJsonFromText(markdown)).toEqual({ test: 123 });
    });

    it('extracts JSON via boundary fallback', () => {
        const messy = "Sure, here is what I thought: { \"a\": 1 } and that is it.";
        expect(extractJsonFromText(messy)).toEqual({ a: 1 });
    });

    it('returns null on completely invalid stuff', () => {
        expect(extractJsonFromText("No JSON here!")).toBeNull();
    });
});
