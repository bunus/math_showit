// Independent geometry engine for QA. Implements cube-plane intersection from scratch.
const VERTS = [];
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) VERTS.push([x, y, z]);
const EDGES = [];
for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) {
  const a = VERTS[i], b = VERTS[j];
  let diff = 0; for (let k = 0; k < 3; k++) if (a[k] !== b[k]) diff++;
  if (diff === 1) EDGES.push([a, b]);
}
const add = (a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub = (a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul = (a,s)=>[a[0]*s,a[1]*s,a[2]*s];
const dot = (a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross = (a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const len = a=>Math.sqrt(dot(a,a));
const dot2 = (a,b)=>a[0]*b[0]+a[1]*b[1];
const len2 = a=>Math.sqrt(dot2(a,a));
const sub2 = (a,b)=>[a[0]-b[0],a[1]-b[1]];
const norm2 = a=>{const l=len2(a); return [a[0]/l,a[1]/l];};
export const normalize = a=>{const l=len(a); return [a[0]/l,a[1]/l,a[2]/l];};
export const support = n=>Math.abs(n[0])+Math.abs(n[1])+Math.abs(n[2]);

// Returns ordered 3D polygon vertices of plane n.x=d intersect cube, or null.
export function section(n, d) {
  const pts = [];
  for (const [a, b] of EDGES) {
    const fa = dot(n, a) - d, fb = dot(n, b) - d;
    if (fa * fb < 0) {
      const t = fa / (fa - fb);
      pts.push([a[0] + t*(b[0]-a[0]), a[1] + t*(b[1]-a[1]), a[2] + t*(b[2]-a[2])]);
    }
  }
  if (pts.length < 3) return null;
  let center = [0,0,0];
  for (const p of pts) center = add(center, p);
  center = mul(center, 1/pts.length);
  const helper = Math.abs(n[0]) < 0.9 ? [1,0,0] : [0,1,0];
  const u = normalize(cross(n, helper));
  const v = cross(n, u);
  const q = pts.map(p => [dot(sub(p,center),u), dot(sub(p,center),v)]);
  const order = q.map((p,i)=>[Math.atan2(p[1],p[0]), i]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  let P = order.map(i=>pts[i]);
  let Q = order.map(i=>q[i]);
  let area2 = 0;
  for (let i = 0; i < Q.length; i++) { const a=Q[i], b=Q[(i+1)%Q.length]; area2 += a[0]*b[1]-b[0]*a[1]; }
  if (area2 < 0) { P.reverse(); Q.reverse(); }
  const outP = [], outQ = [];
  for (let i = 0; i < P.length; i++) {
    if (outP.length && len(sub(P[i], outP[outP.length-1])) < 1e-7) continue;
    outP.push(P[i]); outQ.push(Q[i]);
  }
  if (outP.length > 2 && len(sub(outP[0], outP[outP.length-1])) < 1e-7) { outP.pop(); outQ.pop(); }
  if (outP.length < 3) return null;
  return { points: outP, coords2D: outQ };
}

export function analyzeGeo(sec) {
  const P = sec.points, Q = sec.coords2D, m = P.length;
  const sides = [], angles = [];
  for (let i = 0; i < m; i++) sides.push(len(sub(P[(i+1)%m], P[i])));
  for (let i = 0; i < m; i++) {
    const a = sub2(Q[(i-1+m)%m], Q[i]), b = sub2(Q[(i+1)%m], Q[i]);
    const c = dot2(a,b)/(len2(a)*len2(b));
    angles.push(Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI);
  }
  const dirs = [];
  for (let i = 0; i < m; i++) dirs.push(norm2(sub2(Q[(i+1)%m], Q[i])));
  const pairs = [];
  for (let i = 0; i < m; i++) for (let j = i+1; j < m; j++) {
    if (Math.abs(Math.abs(dot2(dirs[i], dirs[j])) - 1) < 1e-9) pairs.push([i, j]);
  }
  const allSidesEqual = Math.max(...sides) - Math.min(...sides) <= 0.004 * Math.max(...sides);
  const allAnglesEqual = Math.max(...angles) - Math.min(...angles) <= 0.7;
  const rightCount = angles.filter(a => Math.abs(a - 90) <= 0.7).length;
  return { sides, unitSides: sides.map(s=>s*0.5), angles, pairs, allSidesEqual, allAnglesEqual, rightCount,
    minAngle: Math.min(...angles), maxAngle: Math.max(...angles) };
}

const relClose = (a,b,tol)=>Math.abs(a-b) <= tol*Math.max(Math.abs(a),Math.abs(b),1e-12);
const parallel2 = (a,b)=>Math.abs(Math.abs(dot2(norm2(a), norm2(b))) - 1) < 1e-9;

export function classifyGeo(analysis, coords2D) {
  const { sides, pairs, allSidesEqual, allAnglesEqual, rightCount } = analysis;
  const m = sides.length;
  if (m === 3) {
    const e01 = relClose(sides[0],sides[1],0.004), e12 = relClose(sides[1],sides[2],0.004), e02 = relClose(sides[0],sides[2],0.004);
    if (e01 && e12) return 'equilateral';
    if (e01 || e12 || e02) return 'isosceles';
    return 'scalene';
  }
  if (m === 4) {
    const e = [0,1,2,3].map(i => sub2(coords2D[(i+1)%4], coords2D[i]));
    const q02 = parallel2(e[0], e[2]);
    const q13 = parallel2(e[1], e[3]);
    if (q02 && q13) {
      if (rightCount === 4 && allSidesEqual) return 'square';
      if (rightCount === 4) return 'rectangle';
      if (allSidesEqual) return 'rhombus';
      return 'parallelogram';
    }
    if (q02 || q13) {
      const legA = q02 ? sides[1] : sides[0];
      const legB = q02 ? sides[3] : sides[2];
      return relClose(legA, legB, 0.004) ? 'isosceles-trapezoid' : 'trapezoid';
    }
    return 'quadrilateral';
  }
  if (m === 5) return 'pentagon';
  if (m === 6) {
    if (allSidesEqual && allAnglesEqual) return 'regular-hexagon';
    if (allSidesEqual) return 'equilateral-hexagon';
    if (allAnglesEqual) return 'equiangular-hexagon';
    return 'hexagon';
  }
  return 'polygon';
}

export const NAME_BY_TYPE = {
  'equilateral': '等边三角形', 'isosceles': '等腰三角形', 'scalene': '不等边三角形',
  'square': '正方形', 'rectangle': '矩形', 'rhombus': '菱形', 'parallelogram': '平行四边形',
  'trapezoid': '梯形', 'isosceles-trapezoid': '等腰梯形', 'pentagon': '五边形',
  'regular-hexagon': '正六边形', 'equilateral-hexagon': '等边六边形',
  'equiangular-hexagon': '等角六边形', 'hexagon': '一般六边形'
};

export function randomUnitVector(rand) {
  let x, y, z, l;
  do {
    x = rand()*2-1; y = rand()*2-1; z = rand()*2-1; l = Math.sqrt(x*x+y*y+z*z);
  } while (l < 1e-6 || l > 1);
  return [x/l, y/l, z/l];
}
