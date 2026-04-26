const fs = require('fs');

let epPath = 'src/lib/components/ExplorerPanel.svelte';
let epText = fs.readFileSync(epPath, 'utf8');

epText = epText.replace(/function recalculateNumbering\(\) \{[\s\S]*?scene\.sceneNumber = currentScene;\n\s*\}\);\n\s*\}/, `function recalculateNumbering() {
                let currentChapter = 0;
                let currentScene = 0;
                let lastOrigChapter = -1;

                documentState.project.scenes.forEach(scene => {
                        if (scene.chapterNumber !== lastOrigChapter) {
                                currentChapter++;
                                currentScene = 1;
                                lastOrigChapter = scene.chapterNumber;
                        } else {
                                currentScene++;
                        }
                        
                        // Update title if it matches the default 'Scene X' format
                        const defaultTitleRegex = /^Scene \\d+$/;
                        if (defaultTitleRegex.test(scene.title)) {
                                scene.title = \`Scene \${currentScene}\`;
                        }

                        scene.chapterNumber = currentChapter;
                        scene.sceneNumber = currentScene;
                });
        }`);

fs.writeFileSync(epPath, epText);
console.log('Fixed numbering logic.');
