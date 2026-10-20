import json, re, math
import numpy as np

html = open('index.html', encoding='utf-8').read()
# extract PRESET_DEFS block
start = html.index('var PRESET_DEFS = [')
end = html.index('];', start) + 2
block = html[start:end]
# parse each preset object by id/name/raw/rawD
presets = []
for m in re.finditer(r"id: '([^']+)',\s*name: '([^']+)',\s*en: '([^']+)',\s*raw: \[([^\]]+)\],\s*rawD: ([0-9.]+)", block):
    pid, name, en, raw, rawd = m.groups()
    rawv = [float(x.strip()) for x in raw.split(',')]
    presets.append((pid, name, rawv, float(rawd)))
print('parsed', len(presets), 'presets')
for p in presets: print(p)

verts=[(x,y,z) for x in (-1,1) for y in (-1,1) for z in (-1,1)]
edges=[]
for i in range(8):
    for j in range(i+1,8):
        a,b=verts[i],verts[j]
        if sum(1 for k in range(3) if a[k]!=b[k])==1: edges.append((a,b))
def norm(v):
    l=math.sqrt(sum(c*c for c in v)); return [c/l for c in v]
def section(n,d):
    pts=[]
    for a,b in edges:
        fa=sum(n[k]*a[k] for k in range(3))-d; fb=sum(n[k]*b[k] for k in range(3))-d
        if fa*fb<0:
            t=fa/(fa-fb); pts.append(tuple(a[k]+t*(b[k]-a[k]) for k in range(3)))
    if len(pts)<3: return None
    P=np.array(pts,float); cen=P.mean(axis=0); nn=np.array(n,float)
    tmp=np.array([1.0,0,0]) if abs(nn[0])<0.9 else np.array([0,1.0,0])
    u=np.cross(nn,tmp); u/=np.linalg.norm(u); v=np.cross(nn,u)
    Q=np.stack([(P-cen)@u,(P-cen)@v],axis=1)
    order=np.argsort(np.arctan2(Q[:,1],Q[:,0])); P2=Q[order]; P3=P[order]
    area=sum(P2[i][0]*P2[(i+1)%len(P2)][1]-P2[(i+1)%len(P2)][0]*P2[i][1] for i in range(len(P2)))
    if area<0: P2=P2[::-1]; P3=P3[::-1]
    n_=len(P2)
    sides=[float(np.linalg.norm(P2[(i+1)%n_]-P2[i]))*0.5 for i in range(n_)]
    angles=[]
    for i in range(n_):
        av=P2[i-1]-P2[i]; bv=P2[(i+1)%n_]-P2[i]
        angles.append(float(math.degrees(math.acos(max(-1,min(1,(av@bv)/np.linalg.norm(av)/np.linalg.norm(bv)))))))
    dirs=[]
    for i in range(n_):
        dv=P2[(i+1)%n_]-P2[i]; dirs.append(dv/np.linalg.norm(dv))
    pairs=[]
    for i in range(n_):
        for j in range(i+1,n_):
            if abs(abs(dirs[i]@dirs[j])-1)<1e-9: pairs.append([i,j])
    return dict(points=[[float(c) for c in p] for p in P3], unitSides=sides, angles=angles, pairs=pairs)

def classify(p, s):
    m=p['sides']
    sides=s['unitSides']; angles=s['angles']; pairs=s['pairs']
    allEqS=max(sides)-min(sides)<=0.004*max(sides); allEqA=max(angles)-min(angles)<=0.7
    right=sum(1 for a in angles if abs(a-90)<=0.7)
    rel=lambda a,b: abs(a-b)<=0.004*max(abs(a),abs(b),1e-12)
    if m==3:
        e=[rel(sides[0],sides[1]),rel(sides[1],sides[2]),rel(sides[0],sides[2])]
        return 'equilateral' if e[0] and e[1] else ('isosceles' if any(e) else 'scalene')
    if m==4:
        d=[np.array(s['points'][(i+1)%4])-np.array(s['points'][i]) for i in range(4)]
        def par(a,b): 
            a=a/np.linalg.norm(a); b=b/np.linalg.norm(b); return abs(abs(a@b)-1)<1e-9
        q02=par(d[0],d[2]); q13=par(d[1],d[3])
        if q02 and q13:
            if right==4 and allEqS: return 'square'
            if right==4: return 'rectangle'
            if allEqS: return 'rhombus'
            return 'parallelogram'
        if q02 or q13:
            legA=sides[1] if q02 else sides[0]; legB=sides[3] if q02 else sides[2]
            return 'isosceles-trapezoid' if rel(legA,legB) else 'trapezoid'
        return 'quadrilateral'
    if m==5: return 'pentagon'
    if m==6:
        if allEqS and allEqA: return 'regular-hexagon'
        if allEqS: return 'equilateral-hexagon'
        if allEqA: return 'equiangular-hexagon'
        return 'hexagon'
    return 'polygon'

out=[]
for pid,name,raw,rawd in presets:
    L=math.sqrt(sum(c*c for c in raw)); n=norm(raw); d=rawd/L
    sec=section(n,d)
    if sec is None:
        print('WARN no section', pid); continue
    a=classify(dict(sides=len(sec['unitSides'])), sec)
    sides=sorted(sec['unitSides'])
    angs=sorted(sec['angles'])
    out.append(dict(id=pid,name=name,type=a,sides=len(sides),normal=n,d=d,unitSides=sides,angles=angs,
        parallelPairCount=len(sec['pairs']),rightCount=sum(1 for x in sec['angles'] if abs(x-90)<=0.7),
        allSidesEqual=bool(max(sec['unitSides'])-min(sec['unitSides'])<=0.004*max(sec['unitSides'])),
        allAnglesEqual=bool(max(sec['angles'])-min(sec['angles'])<=0.7),
        vertices=sec['points'], raw=raw, rawD=rawd))
json.dump(dict(source='parsed from index.html PRESET_DEFS',sha256='42EE34D3765328E8270BC0E3072A1ECADB081122680EB1CB5DF31C5BB370E63A',presets=out),open('qa/_tools/expected.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('wrote expected for', len(out))
for x in out: print(x['id'], '|', x['name'], '|', x['type'], '| sides', x['sides'], '| pairs', x['parallelPairCount'], '| right', x['rightCount'])
