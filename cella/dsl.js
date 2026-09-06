/* Cella's expression DSL and its grammar -> partials + cuts. DOM-free.

   A hand-adapted fork of aliquoto's: same compileExpr and MENV, forked
   buildPartials for the resonator domain (a Q column, a q law line, `cut` lines,
   no per-partial ADSR). See ../../DEPENDENCIES.md for what is shared and what is
   deliberately not.

   The mutable state - patch seed, voice counter, FILES, build bank - was
   page-level before the extraction and is the same state now, reached through
   accessors because an imported binding cannot be assigned to. */
import { makeSignalBank, voiceSeed } from "./signals.js";

/* ================= DSL (ported from aliquoto) ================= */
const PRIMES=(()=>{const a=[],lim=4000,s=new Uint8Array(lim).fill(1);
  for(let i=2;i<lim;i++){if(s[i]){a.push(i);for(let j=i*i;j<lim;j+=i)s[j]=0;}}return a;})();
function prime(n){n=Math.max(1,Math.round(n));return PRIMES[n-1]||PRIMES[PRIMES.length-1];}
function fib(n){n=Math.max(1,Math.round(n));let a=1,b=1;for(let i=2;i<n;i++)[a,b]=[b,a+b];return b;}
function clip01(x){return Math.max(0,Math.min(1,isFinite(x)?x:0));}


/* Cella already drops a file in as excitation - the sound enters the audio path
   and rings the resonators. Arc 1.2 gives the same file its other role without a
   second control: analysed at load, it also answers as numbers. So one dropped
   sound both rings the room and says how the room should be shaped, and a patch
   can do either or both. file1(t) is its loudness, file1(hz,t) its energy at hz,
   wave1(t) its samples. */
const FILES={file1:null,wave1:null};
const FILE_SENT=new WeakMap(); let FILE_VER=0;
function fileNames(){ const o={}; for(const k in FILES) o[k]=1; return o; }
function filePayload(ctx){ if(!ctx) return FILES;
  if(FILE_SENT.get(ctx)===FILE_VER) return null;
  FILE_SENT.set(ctx,FILE_VER); return FILES; }
function filesChanged(){ FILE_VER++; reseedBuild(); }
let PATCH_SEED=1, buildBank=makeSignalBank(PATCH_SEED,FILES), VOICE_N=0;
function reseedBuild(){ buildBank=makeSignalBank(PATCH_SEED,FILES); }
/* A voice is seeded by patch, pitch and its position in the performance, so a
   repeated key is not a bit-identical repeat while a whole render still is:
   reset the counter and the same score gives the same audio every time. */
function nextVoiceSeed(hz){ return voiceSeed(PATCH_SEED,hz,VOICE_N++); }
function resetVoiceCounter(){ VOICE_N=0; }
function rnd(a,b){ return buildBank.rnd(a,b); }
function noise(x){ return buildBank.noise(x); }
const MENV={prime,fib,rnd,noise,sin:Math.sin,cos:Math.cos,tan:Math.tan,exp:Math.exp,log:Math.log,
  sqrt:Math.sqrt,pow:Math.pow,abs:Math.abs,floor:Math.floor,round:Math.round,sign:Math.sign,
  min:Math.min,max:Math.max,pi:Math.PI,e:Math.E,tau:2*Math.PI,phi:(1+Math.sqrt(5))/2,
  iff:(c,a,b)=>c?a:b, odd:n=>(Math.round(n)%2!==0)?1:0, even:n=>(Math.round(n)%2===0)?1:0,
  not:x=>x?0:1, clamp:(x,lo,hi)=>Math.min(hi,Math.max(lo,x)), step:(edge,x)=>x>=edge?1:0,
  between:(x,lo,hi)=>(x>=lo&&x<=hi)?1:0, mod:(a,b)=>((a%b)+b)%b, clip01};
const MKEYS=Object.keys(MENV);
function envFor(bank){ const e=Object.assign({},MENV); if(bank) Object.assign(e,bank); return e; }
function compileExpr(expr,vars,bank){
  expr=String(expr).replace(/\*\*/g,"^").replace(/\^/g,"**");
  if(/[^0-9a-zA-Z_.+\-*/%(),<>=!&|\s]/.test(expr)) throw new Error("bad char in: "+expr);
  const env=envFor(bank||buildBank), keys=Object.keys(env);   // a voice bank shadows the build-time one
  const ids=expr.match(/[a-zA-Z_]\w*/g)||[];
  for(const id of ids) if(!vars.includes(id)&&!(id in env)) throw new Error("unknown name: "+id);
  const fn=new Function(...vars,...keys,"return ("+expr+");");
  const vals=keys.map(k=>env[k]);
  return (...v)=>fn(...v,...vals);
}
const K=s=>compileExpr(s,[])();
const isInfTok=t=>/^(inf|infinity|∞|\*)$/i.test(String(t).trim());
const hasT=expr=>/\bt\b/.test(String(expr||""));
function initialPos(fn,args,li,what){ const v=fn(...args,0); if(!isFinite(v)||v<=0) throw new Error("line "+(li+1)+": "+what+"(t) must be >0 at t=0 (try t+1)"); return v; }
function parseBound(tok,ceil){ tok=tok.trim(); if(isInfTok(tok))return ceil;
  const v=Math.round(K(tok)); if(!isFinite(v))throw new Error("bad bound '"+tok+"'"); return v; }

/* ---------- grammar -> resonator partials ----------
   each partial: {ratio, amp, phase(rad), q, pid}   q=Infinity → pure sine */
const MAXPARTS=512, DEFAULTQ=40;
function buildPartials(text,ceil,f0ref,qMul){
  f0ref=f0ref||130.81; qMul=(qMul==null)?1:qMul;
  const parts=[], cuts=[], meta={cuts:0,sums:[],literals:0,qline:null,sines:0,dyn:0};
  const lines=text.split(/\n/); let qFn=null; // global q law line
  const qEval=(tok,vars,vals)=>{ if(isInfTok(tok))return Infinity; return compileExpr(tok,vars)(...vals); };
  for(let li=0;li<lines.length;li++){
    let s=lines[li].split("#")[0].trim(); if(!s)continue;
    if(/^sum\b/i.test(s)){
      let body=s.replace(/^sum\b/i,"").trim(); let whereE=null;
      const wm=body.split(/\bwhere\b/i); if(wm.length>1){ body=wm[0].trim(); whereE=wm.slice(1).join("where").trim(); }
      const ci=body.indexOf(":"); if(ci<0) throw new Error("line "+(li+1)+": sum needs ':' then ratio(n)");
      const decl=body.slice(0,ci), rest=body.slice(ci+1).split(":").map(x=>x.trim());
      const idx=[...decl.matchAll(/([A-Za-z_]\w*)\s*=\s*([^.\s]+)\s*\.\.\s*([^.\s]+)/g)];
      if(!idx.length) throw new Error("line "+(li+1)+": bad index (use n=1..N)");
      const vars=idx.map(m=>m[1]);
      const ranges=idx.map(m=>[parseBound(m[2],ceil),parseBound(m[3],ceil)]);
      const rE=rest[0], aE=rest[1]||"1", pE=rest[2]||"0", qE=rest[3]||null;
      const EV=[...vars,"r","hz","f0"];
      const rHasT=hasT(rE), qHasT=!!qE && !isInfTok(qE) && hasT(qE);
      const fr=compileExpr(rE,rHasT?[...vars,"t"]:vars), fa=compileExpr(aE,EV), fp=compileExpr(pE,EV);
      const qVars=[...vars,"r","hz","f0","t"];
      const fq=(qE&&!isInfTok(qE))?compileExpr(qE,qHasT?qVars:EV):null;
      const fw=whereE?compileExpr(whereE,EV):null;
      meta.sums.push({vars,ranges,r:rE,li});
      let acc=[[]];
      for(const [lo,hi] of ranges){ const nx=[];
        for(const pre of acc) for(let v=lo;v<=hi;v++){ nx.push(pre.concat(v)); if(nx.length>MAXPARTS*4)throw new Error("line "+(li+1)+": sum too large"); }
        acc=nx; }
      for(const c of acc){ const r=rHasT?initialPos(fr,c,li,"r"):fr(...c), hz=r*f0ref;
        if(fw && !fw(...c,r,hz,f0ref)) continue;
        const a=fa(...c,r,hz,f0ref), p=fp(...c,r,hz,f0ref);
        let q = qE==null ? null : (isInfTok(qE)?Infinity:(qHasT?fq(...c,r,hz,f0ref,0):fq(...c,r,hz,f0ref)));
        if(!isFinite(r)||r<=0||!isFinite(a)||a===0) continue;
        const pt={ratio:r,amp:a,phase:(p||0)*Math.PI/180,q,pid:"s"+li+":"+c.join(",")};
        if(rHasT||qHasT){ pt.dyn={}; if(rHasT)pt.dyn.r={expr:rE,vars:[...vars,"t"],vals:[...c]};
          if(qHasT)pt.dyn.q={expr:qE,vars:qVars,vals:[...c]}; }
        parts.push(pt);
        if(parts.length>MAXPARTS) throw new Error("line "+(li+1)+": >"+MAXPARTS+" partials — lower Σ ceil"); }
    } else if(/^env\b/i.test(s)){
      let e=s.replace(/^env\b/i,"").trim(); if(e[0]===":")e=e.slice(1).trim();
      const fe=compileExpr(e,["r","hz","f0"]);
      for(const pt of parts){ const m=fe(pt.ratio,pt.ratio*f0ref,f0ref); if(isFinite(m))pt.amp*=m; }
    } else if(/^cut\b/i.test(s)){
      /* cut : r : depth : q - a zero, not a pole. It is not a line in the bank:
         it takes the bank's own output and subtracts a unity-gain bandpass of
         it, y = x - depth*bp(x), so it carves whatever is actually there -
         Lorentzian tails, ensemble bloom, another line's ring-out - rather than
         scaling a line's amplitude at build time the way env does. Its centre is
         ratio-defined, so it keyfollows; a static notch is the degenerate case. */
      let e=s.replace(/^cut\b/i,"").trim(); if(e[0]===":")e=e.slice(1).trim();
      const c=e.split(":").map(x=>x.trim());
      const cRHasT=hasT(c[0]), cQE=c.length>2?c[2]:null, cQHasT=!!cQE&&hasT(cQE);
      const cr=cRHasT?initialPos(compileExpr(c[0],["t"]),[],li,"r"):K(c[0]);
      if(!isFinite(cr)||cr<=0) throw new Error("line "+(li+1)+": cut needs a ratio > 0");
      const cd=c.length>1?K(c[1]):1;
      const cQVars=["r","hz","f0","t"];
      let cq = cQE==null ? DEFAULTQ : (cQHasT?compileExpr(cQE,cQVars)(cr,cr*f0ref,f0ref,0):K(cQE));
      if(!isFinite(cq)) throw new Error("line "+(li+1)+": a cut needs a finite Q");
      const ct={ratio:cr,depth:cd,q:Math.max(.5,cq)};
      if(cRHasT||cQHasT){ ct.dyn={}; if(cRHasT)ct.dyn.r={expr:c[0],vars:["t"],vals:[]};
        if(cQHasT)ct.dyn.q={expr:cQE,vars:cQVars,vals:[]}; }
      cuts.push(ct); meta.cuts++;
    } else if(/^q\b/i.test(s)){
      let e=s.replace(/^q\b/i,"").trim(); if(e[0]===":")e=e.slice(1).trim();
      if(isInfTok(e)){ qFn=()=>Infinity; } else { qFn=compileExpr(e,["r","hz","f0"]); }
      meta.qline=e;
    } else {
      const p=s.split(":").map(x=>x.trim());
      const rHasT=hasT(p[0]), qE=p.length>3?p[3]:null, qHasT=!!qE && !isInfTok(qE) && hasT(qE);
      const r=rHasT?initialPos(compileExpr(p[0],["t"]),[],li,"r"):K(p[0]);
      if(!isFinite(r)||r<=0) throw new Error("line "+(li+1)+": bad ratio");
      const a=p.length>1?K(p[1]):1, ph=p.length>2?K(p[2]):0;
      const qVars=["r","hz","f0","t"];
      let q = qE==null ? null : (isInfTok(qE)?Infinity:(qHasT?compileExpr(qE,qVars)(r,r*f0ref,f0ref,0):K(qE)));
      if(a!==0){ const pt={ratio:r,amp:a,phase:(ph||0)*Math.PI/180,q,pid:"l"+li};
        if(rHasT||qHasT){ pt.dyn={}; if(rHasT)pt.dyn.r={expr:p[0],vars:["t"],vals:[]};
          if(qHasT)pt.dyn.q={expr:qE,vars:qVars,vals:[]}; }
        parts.push(pt); meta.literals++; }
    }
  }
  // resolve unset Q: global q law line, else the constant default; then apply the global Q× knob
  for(const pt of parts){ if(pt.q==null){ pt.q = qFn ? qFn(pt.ratio,pt.ratio*f0ref,f0ref) : DEFAULTQ; }
    if(!isFinite(pt.q)) meta.sines++; else pt.q=Math.max(.5,pt.q*qMul);
    if(pt.dyn) meta.dyn++; }
  return {parts,cuts,meta};
}


function setPatchSeed(v){ PATCH_SEED=(v>>>0); }
function getPatchSeed(){ return PATCH_SEED; }
function getBuildBank(){ return buildBank; }

export { prime, fib, clip01, MENV, MKEYS, hasT, envFor, compileExpr, K, isInfTok,
         initialPos, DEFAULTQ, MAXPARTS, parseBound, buildPartials,
         FILES, fileNames, filePayload, filesChanged, reseedBuild,
         nextVoiceSeed, resetVoiceCounter, rnd, noise,
         setPatchSeed, getPatchSeed, getBuildBank };
