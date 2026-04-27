/**
 * Safely parses LLM output into a generic JSON array or object.
 * Strips markdown code blocks like ```json ... ``` and attempts to fix common malformations.
 */
export function extractJsonFromText(rawText: string): any | null {
    if (!rawText || rawText.trim() === '') return null;

    let text = rawText.trim();

    // Strip markdown code blocks
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/im;
    const codeMatch = codeBlockRegex.exec(text);
    if (codeMatch && codeMatch[1]) {
        text = codeMatch[1].trim();
    } else {
        // Sometimes the AI just forgets the closing ``` so we try a lazy match
        const startRegex = /```(?:json)?\s*([\s\S]*)/im;
        const startMatch = startRegex.exec(text);
        if (startMatch && startMatch[1]) {
            text = startMatch[1].trim();
        }
    }

    try {
        return JSON.parse(text);
    } catch (e) {
        // If it's still failing, we can try to find an array or object boundary
        try {
            const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (arrayMatch) {
                return JSON.parse(arrayMatch[0]);
            }
            
            const objMatch = text.match(/\{[\s\S]*\}/);
            if (objMatch) {
                return JSON.parse(objMatch[0]);
            }
        } catch (innerE) {
            console.error('Failed to parse JSON even with boundary extraction', text);
        }
        
        return null;
    }
}
