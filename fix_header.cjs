const fs = require('fs');

const tpPath = 'src/lib/components/Header.svelte';
let tpText = fs.readFileSync(tpPath, 'utf8');

// Add settings icon to header
if (!tpText.includes('showSettings')) {
    tpText = tpText.replace(
        `import { AlignLeft, PanelRight, Users, Type, Save } from 'lucide-svelte';`,
        `import { AlignLeft, PanelRight, Users, Type, Save, Settings } from 'lucide-svelte';`
    );

    tpText = tpText.replace(
        `<button class="p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-md transition-colors font-medium">`,
        `<button class="p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-md transition-colors" onclick={() => uiState.showSettings = true} title="Settings">
                        <Settings size={20} />
                </button>
                <div class="h-6 w-px bg-zinc-300 mx-2"></div>

                <button class="p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-md transition-colors font-medium">`
    );

    fs.writeFileSync(tpPath, tpText);
}

console.log('Header updated');
