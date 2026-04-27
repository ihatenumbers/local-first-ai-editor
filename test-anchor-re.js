const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let searchString = "code – /Lun/2048-10-3/DirWy/";
const alphaWords = searchString.split(/[\s\W]+/).filter(w => w.length > 0);
console.log(alphaWords);
if (alphaWords.length >= 5) {
  const startWords = alphaWords.slice(0, 4).map(escapeRegExp).join('[\\s\\W]*');
  const endWords = alphaWords.slice(-4).map(escapeRegExp).join('[\\s\\W]*');
  const fallbackRegexStr = `${startWords}[\\s\\S]{0,1000}?${endWords}`;
  console.log(fallbackRegexStr);
  const fallbackRegex = new RegExp(fallbackRegexStr, 'i');
  console.log("MATCH?:", fallbackRegex.test("A longer text here code - /Lun/2048-10-3/DirWy/ with more words"));
}
