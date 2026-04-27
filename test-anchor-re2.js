const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let searchString = "code – /Lun/2048-10-3/DirWy/";
const alphaWords = searchString.split(/[\s\W]+/).filter(w => w.length > 0);
console.log("Words length:", alphaWords.length);
if (alphaWords.length >= 8) {
  // Only do this if we are SURE they don't overlap!
  const startWords = alphaWords.slice(0, 4).map(escapeRegExp).join('[\\s\\W]*');
  const endWords = alphaWords.slice(-4).map(escapeRegExp).join('[\\s\\W]*');
  const fallbackRegexStr = `${startWords}[\\s\\S]{0,1000}?${endWords}`;
  console.log(fallbackRegexStr);
  const fallbackRegex = new RegExp(fallbackRegexStr, 'i');
  console.log("MATCH?:", fallbackRegex.test("A longer text here code - /Lun/2048-10-3/DirWy/ with more words"));
} else {
  console.log("Not enough words to safely split.");
}
