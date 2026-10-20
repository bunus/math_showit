import fs from 'node:fs';
import { section, analyzeGeo, classifyGeo, NAME_BY_TYPE, normalize, support } from './geom.mjs';
const exp = JSON.parse(fs.readFileSync('qa/_tools/expected.json','utf8'));
let bad = 0;
for (const p of exp.presets) {
  const sec = section(p.normal, p.d);
  if (!sec) { console.log('NULL', p.id); bad++; continue; }
  const a = analyzeGeo(sec);
  const t = classifyGeo(a, sec.coords2D);
  const sidesOk = Math.abs(a.unitSides.length - p.sides) === 0;
  const typeOk = t === p.type;
  const ss = a.unitSides.slice().sort((x,y)=>x-y), es = p.unitSides.slice().sort((x,y)=>x-y);
  const maxDiff = Math.max(...ss.map((v,i)=>Math.abs(v-es[i])));
  const angDiff = Math.max(...a.angles.slice().sort((x,y)=>x-y).map((v,i)=>Math.abs(v-p.angles.slice().sort((x,y)=>x-y)[i])));
  console.log(p.id, 'sides', a.unitSides.length, sidesOk?'OK':'BAD', 'type', t, typeOk?'OK':'BAD', 'maxSideDiff', maxDiff.toExponential(2), 'maxAngDiff', angDiff.toExponential(2), 'pairs', a.pairs.length, 'exp', p.parallelPairCount);
  if (!sidesOk || !typeOk || maxDiff > 1e-6 || angDiff > 1e-5) bad++;
}
console.log('BAD', bad);
