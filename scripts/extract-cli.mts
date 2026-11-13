import { renderAndCollect } from "../src/lib/extract/browser";
import { analyze } from "../src/lib/extract/analyze";
const url = process.argv[2];
const t=Date.now();
const { raw } = await renderAndCollect(url, (s)=>console.error("..",s, Date.now()-t));
console.error("ms", Date.now()-t, "buttons", raw.components.buttons.length);
console.log(JSON.stringify(analyze(raw), null, 1).slice(0, 5000));
