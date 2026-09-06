/* The expression DSL and the grammar that builds partials from it. DOM-free.

   The mutable state here - the patch seed, the voice counter, the loaded files
   and the build-time bank - was page-level before the extraction and is the same
   state now, only somewhere a test can reach it without a DOM. The page reads and
   writes it through the accessors below rather than by assignment, because an
   imported binding cannot be assigned to. */
import { makeSignalBank, voiceSeed } from "./signals.js";

/* ---------- math env for the DSL ---------- */
const PRIMES=(()=>{const a=[],lim=4000,s=new Uint8Array(lim).fill(1);
  for(let i=2;i<lim;i++){if(s[i]){a.push(i);for(let j=i*i;j<lim;j+=i)s[j]=0;}}return a;})();
function prime(n){n=Math.max(1,Math.round(n));return PRIMES[n-1]||PRIMES[PRIMES.length-1];}
function fib(n){n=Math.max(1,Math.round(n));let a=1,b=1;for(let i=2;i<n;i++)[a,b]=[b,a+b];return b;}
function clip01(x){return Math.max(0,Math.min(1,isFinite(x)?x:0));}

/* FILES holds one analysis record per slot, or null when the slot is empty.
   The names are in expression scope either way - an empty slot reads 0 - so a
   patch written against a file still parses after the file is cleared. */
const FILES={file1:null,wave1:null};
/* An analysis record is ~40 KB per second of sound, and a voice is constructed
   per note, so shipping it in processorOptions every time would copy megabytes
   at each note-on for an ordinary-length file. Instead it crosses once per audio
   context per version of the file; voices carry only the names, and resolve
   against the worklet's module-scope FILEBANK when an expression actually calls
   one. Resolving at call time rather than at construction means the order the
   node and the payload arrive in cannot matter. */
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
function adsrShape(t,a,d,s,r){ t=Math.max(0,t); a=Math.max(.0001,a); d=Math.max(.0001,d); s=clip01(s);
  if(t<a)return t/a; if(t<a+d)return 1+(s-1)*((t-a)/d); return s; }
const MENV={prime,fib,rnd,noise,sin:Math.sin,cos:Math.cos,tan:Math.tan,exp:Math.exp,log:Math.log,
  sqrt:Math.sqrt,pow:Math.pow,abs:Math.abs,floor:Math.floor,round:Math.round,sign:Math.sign,
  min:Math.min,max:Math.max,pi:Math.PI,e:Math.E,tau:2*Math.PI,phi:(1+Math.sqrt(5))/2,
  // conditionals / piecewise
  iff:(c,a,b)=>c?a:b, odd:n=>(Math.round(n)%2!==0)?1:0, even:n=>(Math.round(n)%2===0)?1:0,
  not:x=>x?0:1, clamp:(x,lo,hi)=>Math.min(hi,Math.max(lo,x)), step:(edge,x)=>x>=edge?1:0,
  between:(x,lo,hi)=>(x>=lo&&x<=hi)?1:0, mod:(a,b)=>((a%b)+b)%b, clip01, adsrShape, adsr:adsrShape};
const MKEYS=Object.keys(MENV);
const hasT=expr=>/\bt\b/.test(expr||"");
function envFor(bank){ const e=Object.assign({},MENV); if(bank) Object.assign(e,bank); return e; }
function compileExpr(expr,vars,bank){
  expr=expr.replace(/\*\*/g,"^").replace(/\^/g,"**");
  if(/[^0-9a-zA-Z_.+\-*/%(),<>=!&|\s]/.test(expr)) throw new Error("bad char in: "+expr);
  const env=envFor(bank||buildBank), keys=Object.keys(env);   // a voice bank shadows the build-time one
  const ids=expr.match(/[a-zA-Z_]\w*/g)||[];
  for(const id of ids) if(!vars.includes(id)&&!(id in env)) throw new Error("unknown name: "+id);
  const fn=new Function(...vars,...keys,"return ("+expr+");");
  const vals=keys.map(k=>env[k]);
  return (...v)=>fn(...v,...vals);
}
const K=s=>compileExpr(s,[])();
function ADSR(a,d,s,r){
  const time=x=>Math.max(0.001,Math.min(8,isFinite(x)?+x:0.001));
  return {a:time(a),d:time(d),s:Math.max(0,Math.min(1,isFinite(s)?+s:0)),r:time(r)};
}
function evalADSR(fns,args){ return ADSR(fns[0](...args),fns[1](...args),fns[2](...args),fns[3](...args)); }
function initialRatio(fn,args,line){
  const v=fn(...args,0);
  if(!isFinite(v)||v<=0) throw new Error("line "+line+": r(t) must be >0 at t=0 (try t+1)");
  return v;
}

/* ---------- grammar -> partials (+ meta for the math card) ---------- */
const MAXPARTS=1024;
function parseBound(tok,ceil){ tok=tok.trim();
  if(/^(inf|infinity|∞|\*)$/i.test(tok)) return ceil;
  const v=Math.round(K(tok)); if(!isFinite(v)) throw new Error("bad bound '"+tok+"'"); return v; }
function buildPartials(text,ceil,f0ref){
  f0ref=f0ref||261.63;
  const parts=[], meta={sums:[],envs:[],gains:[],adsrs:[],literals:0,dynamicRatio:false,dynamicGain:false}; const lines=text.split(/\n/);
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
      if(vars.includes("t")) throw new Error("line "+(li+1)+": 't' is reserved for time");
      const ranges=idx.map(m=>[parseBound(m[2],ceil),parseBound(m[3],ceil)]);
      const rE=rest[0], aE=rest[1]||"1", pE=rest[2]||"0";
      const EV=[...vars,"r","hz","f0"]; // r=this partial's ratio, hz=r·f0, f0=X reference pitch
      const rHasT=hasT(rE);
      const fr=compileExpr(rE,rHasT?[...vars,"t"]:vars), fa=compileExpr(aE,EV), fp=compileExpr(pE,EV);
      if(rest.length>7) throw new Error("line "+(li+1)+": too many ':' fields");
      if(rest.length>3 && rest.length<7) throw new Error("line "+(li+1)+": sum ADSR needs attack:decay:sustain:release");
      const adsE=rest.length>=7?rest.slice(3,7):null, fads=adsE?adsE.map(e=>compileExpr(e,EV)):null;
      const fw=whereE?compileExpr(whereE,EV):null;
      meta.sums.push({vars,ranges,r:rE,a:aE,p:pE,adsr:adsE,where:whereE,decl:decl.trim()});
      let acc=[[]];
      for(const [lo,hi] of ranges){ const nx=[];
        for(const pre of acc) for(let v=lo;v<=hi;v++){ nx.push(pre.concat(v)); if(nx.length>MAXPARTS*4) throw new Error("line "+(li+1)+": sum too large"); }
        acc=nx; }
      for(const c of acc){ const r=rHasT?initialRatio(fr,c,li+1):fr(...c); const hz=r*f0ref;
        if(fw && !fw(...c,r,hz,f0ref)) continue;
        const a=fa(...c,r,hz,f0ref), p=fp(...c,r,hz,f0ref);
        if(!isFinite(r)||!isFinite(a)||!isFinite(p)||a===0) continue;
        const pt={ratio:r,amp:a,phase:p*Math.PI/180,pid:"s"+li+":"+c.join(","),idx:{vars:[...vars],vals:[...c],rE}};
        if(rHasT){ pt.dyn={r:{expr:rE,vars:[...vars,"t"],vals:[...c]}}; meta.dynamicRatio=true; }
        if(fads) pt.adsr=evalADSR(fads,[...c,r,hz,f0ref]);
        parts.push(pt);
        if(parts.length>MAXPARTS) throw new Error("line "+(li+1)+": >"+MAXPARTS+" partials — lower ceiling"); }
    } else if(/^env\b/i.test(s)){
      let e=s.replace(/^env\b/i,"").trim(); if(e[0]===":") e=e.slice(1).trim();
      if(hasT(e)){
        compileExpr(e,["t","r","hz","f0","a"]); meta.gains.push("env "+e); meta.dynamicGain=true;
        for(const pt of parts){ (pt.gains||(pt.gains=[])).push(e); }
      } else {
        const fe=compileExpr(e,["r","hz","f0"]); meta.envs.push(e);
        for(const pt of parts){ const hz=pt.ratio*f0ref; const m=fe(pt.ratio,hz,f0ref); if(isFinite(m)) pt.amp*=m; }
      }
    } else if(/^(gain|shape|ampenv)\b/i.test(s)){
      let e=s.replace(/^(gain|shape|ampenv)\b/i,"").trim(); if(e[0]===":") e=e.slice(1).trim();
      compileExpr(e,["t","r","hz","f0","a"]); meta.gains.push(e); meta.dynamicGain=true;
      for(const pt of parts){ (pt.gains||(pt.gains=[])).push(e); }
    } else if(/^adsr\b/i.test(s)){
      let e=s.replace(/^adsr\b/i,"").trim(); if(e[0]===":") e=e.slice(1).trim();
      const vals=e.split(":").map(x=>x.trim());
      if(vals.length!==4 || vals.some(x=>!x)) throw new Error("line "+(li+1)+": adsr needs attack:decay:sustain:release");
      const fads=vals.map(x=>compileExpr(x,["r","hz","f0"])); meta.adsrs.push(vals);
      for(const pt of parts){ const hz=pt.ratio*f0ref; pt.adsr=evalADSR(fads,[pt.ratio,hz,f0ref]); }
    } else {
      const p=s.split(":").map(x=>x.trim()); let r,a,ph;
      const rHasT=hasT(p[0]);
      try{ r=rHasT?initialRatio(compileExpr(p[0],["t"]),[],li+1):K(p[0]); }catch(err){ throw new Error("line "+(li+1)+": "+err.message); }
      if(p[1]&&hasT(p[1])) throw new Error("line "+(li+1)+": use gain/env for amplitude time functions");
      a=p.length>1?K(p[1]):1; ph=p.length>2?K(p[2]):0;
      if(p.length>7) throw new Error("line "+(li+1)+": too many ':' fields");
      if(p.length>3 && p.length<7) throw new Error("line "+(li+1)+": literal ADSR needs attack:decay:sustain:release");
      if(!isFinite(r)) throw new Error("line "+(li+1)+": bad ratio");
      if(a!==0){
        const pt={ratio:r,amp:a,phase:(ph||0)*Math.PI/180,pid:"l"+li};
        if(rHasT){ pt.dyn={r:{expr:p[0],vars:["t"],vals:[]}}; meta.dynamicRatio=true; }
        if(p.length>=7) pt.adsr=ADSR(K(p[3]),K(p[4]),K(p[5]),K(p[6]));
        parts.push(pt); meta.literals++;
      }
    }
  }
  if(!parts.length) throw new Error("no partials");
  parts.sort((u,v)=>u.ratio-v.ratio);
  return {parts,meta};
}


function setPatchSeed(v){ PATCH_SEED=(v>>>0); }
function getPatchSeed(){ return PATCH_SEED; }
function getBuildBank(){ return buildBank; }

export { prime, fib, clip01, adsrShape, MENV, MKEYS, hasT, envFor, compileExpr,
         K, ADSR, evalADSR, initialRatio, MAXPARTS, parseBound, buildPartials,
         FILES, fileNames, filePayload, filesChanged, reseedBuild,
         nextVoiceSeed, resetVoiceCounter, rnd, noise,
         setPatchSeed, getPatchSeed, getBuildBank };
