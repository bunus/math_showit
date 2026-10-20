import json, math
import numpy as np
E=json.load(open('qa/_tools/expected.json',encoding='utf-8'))
verts=[(x,y,z) for x in (-1,1) for y in (-1,1) for z in (-1,1)]
edges=[]
for i in range(8):
    for j in range(i+1,8):
        a,b=verts[i],verts[j]
        if sum(1 for k in range(3) if a[k]!=b[k])==1: edges.append((a,b))
for p in E['presets']:
    n=p['normal']; d=p['d']
    vdists=[abs(sum(n[k]*v[k] for k in range(3))-d) for v in verts]
    param=[]
    for a,b in edges:
        fa=sum(n[k]*a[k] for k in range(3))-d; fb=sum(n[k]*b[k] for k in range(3))-d
        if fa*fb<0:
            t=fa/(fa-fb); param.append(min(t,1-t))
    print(f"{p['id']:22s} minVertexDist={min(vdists):.4f} minEdgeParamMargin={min(param) if param else None:.4f} supportMargin={ (sum(abs(c) for c in n)-abs(d)):.4f}")
