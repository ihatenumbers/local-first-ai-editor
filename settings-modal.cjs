const fs = require('fs');
const uiPath = 'src/lib/state/ui.svelte.ts';
let uiText = fs.readFileSync(uiPath, 'utf8');

if (!uiText.includes('showSettings')) {
	uiText = uiText.replace(
		'showContextBoard = $state(true);',
		'showContextBoard = $state(true);\n        showSettings = $state(false);'
	);
	fs.writeFileSync(uiPath, uiText);
}
console.log('UI updated');
