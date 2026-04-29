const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds a fuzzy regex from a search string that tolerates whitespace variation,
 * typographic quote substitution, and em/en dash substitution.
 * Returns null if the resulting pattern is invalid.
 */
export function buildFuzzyRegex(searchString: string): RegExp | null {
	const escaped = escapeRegExp(searchString);
	// \u2018\u2019 = curly single quotes, \u201C\u201D = curly double quotes
	const fuzzy = escaped
		.replace(/\s+/g, '\\s+')
		.replace(/['"'\u2018\u2019\u201C\u201D]/gu, "[\\'\"\\u2018\\u2019\\u201C\\u201D]")
		.replace(/[-\u2014\u2013]/gu, '[-\\u2014\\u2013]')
		.replace(/\\\.\\\.\\\.|\\u2026|\u2026/gu, '(?:\\.\\.\\.|\u2026)');
	try {
		return new RegExp(fuzzy, 'i');
	} catch {
		return null;
	}
}

/**
 * Fallback: match on just the first 4 and last 4 words of a long string.
 * Returns null if the string is too short or the pattern is invalid.
 */
export function buildFallbackRegex(searchString: string): RegExp | null {
	const words = searchString.split(/[\s\W]+/).filter((w) => w.length > 0);
	if (words.length < 8) return null;
	const startWords = words.slice(0, 4).map(escapeRegExp).join('[\\s\\W]*');
	const endWords = words.slice(-4).map(escapeRegExp).join('[\\s\\W]*');
	try {
		return new RegExp(`${startWords}[\\s\\S]{0,1000}?${endWords}`, 'i');
	} catch {
		return null;
	}
}
