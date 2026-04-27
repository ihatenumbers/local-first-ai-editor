import { EditorState } from 'prosemirror-state';
import { schema } from 'prosemirror-schema-basic';

// We can construct a doc with raw objects
let parsedDoc = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        { type: "text", text: "At least the case has the standard port, she thought. " },
        { type: "text", marks: [{type: "strong"}], text: "Let's plug it in and see." }
      ]
    },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Hmmm, the display shows only a backup personality file set. No records, no metadata. Not even a photo. The backup file set had a code – /Lun/2048-10-3/DirWy/" }
      ]
    }
  ]
};

let doc = schema.nodeFromJSON(parsedDoc);

let extractedText = '';
let posMapping = [];

doc.descendants((node, pos) => {
  if (node.isText && node.text) {
    for (let i = 0; i < node.text.length; i++) {
        extractedText += node.text[i];
        posMapping.push(pos + i);
    }
  } else if (node.isBlock) {
    if (extractedText.length > 0 && extractedText[extractedText.length - 1] !== '\n') {
        extractedText += '\n';
        posMapping.push(pos);
    }
  }
});

console.log(extractedText);

let searchStr = "At least the case has the standard port, she thought. Let's plug it in and see. Hmmm, the display shows only a backup personality file set. No records, no metadata. Not even a photo. The backup file set had a code – /Lun/2048-10-3/DirWy/";

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
let escapedSearch = escapeRegExp(searchStr);
let fuzzyRegexStr = escapedSearch.replace(/\s+/g, '\\s+');
let fuzzyRegex = new RegExp(fuzzyRegexStr, 'i');

console.log("MATCH:", fuzzyRegex.test(extractedText));
