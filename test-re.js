const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let item = { original_text: "At least the case has the standard port, she thought. Let's plug it in and see. Hmmm, the display shows only a backup personality file set. No records, no metadata. Not even a photo. The backup file set had a code – /Lun/2048-10-3/DirWy/"};
let searchString = item.original_text.trim();

let text = `At least the case has the standard port, she thought. Let's plug it in and see. Hmmm, the display shows only a backup personality file set. No records, no metadata. Not even a photo. The backup file set had a code - /Lun/2048-10-3/DirWy/`;

let escapedSearch = escapeRegExp(searchString);
let fuzzyRegexStr = escapedSearch.replace(/\s+/g, '\\s+');
fuzzyRegexStr = fuzzyRegexStr.replace(/['"‘’“”]/g, "['\"‘’“”]").replace(/[-—–]/g, "[-—–]");
fuzzyRegexStr = fuzzyRegexStr.replace(/(\\\.\\\.\\\.|…)/g, "(\\\.\\\.\\\.|…)");

console.log(new RegExp(fuzzyRegexStr, 'i').test(text));

