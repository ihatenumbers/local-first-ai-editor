import { Node } from '@tiptap/pm/model';
import { schema } from '@tiptap/pm/schema-basic';

const doc = schema.node("doc", null, [
  schema.node("paragraph", null, [schema.text("hello ")]),
  schema.node("paragraph", null, [schema.text("world")]),
]);

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

console.log(JSON.stringify(extractedText));
console.log(posMapping);

