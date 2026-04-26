export function testRoot() {
    $effect.root(() => {
        let x = $state(1);
        $effect(() => { console.log(x) });
    });
}
