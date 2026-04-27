const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const searchString = "hello world. How are you?";
const escapedSearch = escapeRegExp(searchString);
console.log(escapedSearch);

let fuzzyRegexStr = escapedSearch.replace(/\\[tnrfv]/g, '\\s+').replace(/\\ /g, '\\s+');
console.log(fuzzyRegexStr); // Was space replaced?

// Proper replacement:
fuzzyRegexStr = escapedSearch.replace(/\s+/g, '\\s+');
console.log(fuzzyRegexStr);
