const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let searchString = "code - /Lun";
let escapedSearch = escapeRegExp(searchString);
let fuzzyRegexStr = escapedSearch.replace(/\s+/g, '\\s+');
fuzzyRegexStr = fuzzyRegexStr.replace(/[-—–]/g, "[-—–]");
console.log("Regex string:", fuzzyRegexStr);
console.log("Test match:", "code - /Lun".match(new RegExp(fuzzyRegexStr, 'i')));

// What happens with quotes?
searchString = 'he said "hello"';
escapedSearch = escapeRegExp(searchString);
fuzzyRegexStr = escapedSearch.replace(/\s+/g, '\\s+');
fuzzyRegexStr = fuzzyRegexStr.replace(/['"‘’“”]/g, "['\"‘’“”]");
console.log("Regex string:", fuzzyRegexStr);
console.log("Test match:", 'he said "hello"'.match(new RegExp(fuzzyRegexStr, 'i')));

