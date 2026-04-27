// If we want a much looser match, we can just split the search string into words and match them sequentially.
let searchString = "code - /Lun";
let words = searchString.trim().split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
let fuzzyRegexStr = words.join('\\s+([^\\w]*\\s*)*'); // Match words separated by spaces or punctuation
console.log(fuzzyRegexStr);
