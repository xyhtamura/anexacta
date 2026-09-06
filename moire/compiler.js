/* Moire's compiler: text -> one generated voice function, plus the engine state.

   This is moire's counterpart to the other two tools' dsl.js, and it is a
   different animal. Aliquoto and cella parse a grammar into a list of partials
   that the worklet then reads; moire compiles the whole weave into a single
   JavaScript function and ships its source to the worklet, where it is built
   with new Function("BANK", source). PRELUDE is the preamble that function gets.

   Because BANK is now always supplied - by the voice for a compiled voice, by
   FOLD_BANK for the constant-folding calls - PRELUDE no longer has to inline the
   signal block to have a makeSignalBank to fall back on. That was the third copy
   of it in this file, and it is gone.

   compileProgram takes its ceiling as an argument rather than reading it from the
   DOM, which is the only change the extraction forced on it. */
import { makeSignalBank, voiceSeed } from "./signals.js";

const FOLD_BANK = makeSignalBank(1);

/* file1/wave1 hold the same analysis record: file1 answers questions about the
   sound, wave1 hands back the sound itself. One record, two readings, and a
   structured clone of {file1:A,wave1:A} copies A once. */
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
function rnd(a,b){ return buildBank.rnd(a,b) }
function noise(x){ return buildBank.noise(x) }

const RESERVED=new Set(("t f0 op OP sum where state S idxMul driftDepth driftRate pi e phi tau inf NaN Infinity " +
  "sin cos tan asin acos atan atan2 exp log log10 sqrt pow abs min max floor ceil round random rnd " +
  "iff odd even step between clamp clip01 mod prime fib noise file1 wave1 BANK let const var return if else for while function class new").split(/\s+/));
const PRELUDE=`
const tau=Math.PI*2, pi=Math.PI, e=Math.E, phi=(1+Math.sqrt(5))/2, inf=Infinity;
const sin=Math.sin, cos=Math.cos, tan=Math.tan, asin=Math.asin, acos=Math.acos;
const atan=Math.atan, atan2=Math.atan2, exp=Math.exp, log=Math.log, log10=Math.log10 || ((x)=>Math.log(x)/Math.LN10);
const sqrt=Math.sqrt, pow=Math.pow, abs=Math.abs, min=Math.min, max=Math.max, floor=Math.floor, ceil=Math.ceil, round=Math.round;

/* BANK is always supplied - by the voice for a compiled voice, by a default
   bank for the constant-folding calls - so nothing here needs to build one,
   which is what let the signal block come out of this string. */
const __BANK=BANK;
const rnd=__BANK.rnd, noise=__BANK.noise;
const file1=__BANK.file1||(()=>0), wave1=__BANK.wave1||(()=>0);
function iff(c,a,b){return c?a:b}
function odd(n){return Math.abs(Math.round(n))%2?1:0}
function even(n){return odd(n)?0:1}
function step(edge,x){return x>=edge?1:0}
function between(x,a,b){return x>=Math.min(a,b)&&x<=Math.max(a,b)?1:0}
function clamp(x,a,b){return Math.min(Math.max(x,a),b)}
function clip01(x){return clamp(x,0,1)}
function mod(a,b){return ((a%b)+b)%b}
function fib(n){n=Math.max(0,Math.floor(Math.abs(n)||0));let a=0,b=1;for(let i=0;i<n;i++){const c=a+b;a=b;b=c}return a}
function prime(n){n=Math.max(1,Math.floor(Math.abs(n)||1));let count=0,x=1;while(count<n){x++;let ok=true;for(let d=2;d*d<=x;d++)if(x%d===0){ok=false;break}if(ok)count++}return x}
`;

function stripComment(line){
  const i=line.indexOf("#");
  return (i>=0?line.slice(0,i):line).trim();
}
function jsExpr(expr){
  return expr.replace(/∞/g,"Infinity").replace(/\binf\b/gi,"Infinity").replace(/\^/g,"**");
}
// fold prime()/fib() with constant numeric arguments to literals so the
// audio thread never runs a trial-division loop per sample (only dynamic
// args, e.g. prime(S[0]), survive as runtime calls).
function foldConstCalls(expr){
  // scans for prime(...)/fib(...) with a balanced-paren argument (subVars wraps
  // substituted values in parens, so args look like prime((5)+1)) and folds any
  // whose argument is purely numeric. Dynamic args (S[i], signal names) are left.
  const fns=["prime","fib"];
  let guard=0, changed=true;
  while(changed && guard++<256){
    changed=false;
    for(const fn of fns){
      const re=new RegExp("\\b"+fn+"\\s*\\(");
      let idx=0, m;
      while((m=expr.slice(idx).match(re))){
        const start=idx+m.index;
        const paren=expr.indexOf("(",start);
        let depth=0, endp=-1;
        for(let j=paren;j<expr.length;j++){ const ch=expr[j]; if(ch==="(")depth++; else if(ch===")"){ if(--depth===0){endp=j;break;} } }
        if(endp<0){ idx=paren+1; continue; }
        const arg=expr.slice(paren+1,endp);
        if(/^[-+*/%.\d\s()]+$/.test(arg)){
          let v; try{ v=Function("return("+arg+")")(); }catch(e){ v=NaN; }
          if(Number.isFinite(v)){
            expr=expr.slice(0,start)+String(fn==="prime"?prime(v):fib(v))+expr.slice(endp+1);
            changed=true; idx=0; continue;
          }
        }
        idx=endp+1;
      }
    }
  }
  return expr;
}
function escRE(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}
function subVars(expr,vars){
  let out=expr;
  for(const [k,v] of Object.entries(vars)){
    out=out.replace(new RegExp("\\b"+escRE(k)+"\\b","g"),"("+v+")");
  }
  return out;
}
function evalIndexExpr(expr,vars){
  const names=Object.keys(vars), vals=Object.values(vars);
  return Function("BANK",...names,PRELUDE+"return Number("+jsExpr(expr)+");")(FOLD_BANK,...vals);
}
function evalIndexPred(expr,vars){
  const names=Object.keys(vars), vals=Object.values(vars);
  return !!Function("BANK",...names,PRELUDE+"return !!("+jsExpr(expr)+");")(FOLD_BANK,...vals);
}
function parseIndexSpecs(header,ceilLimit,lineNo){
  const specs=[];
  const re=/([A-Za-z_]\w*)\s*=\s*([^.\s]+)\s*\.\.\s*([^\s]+)/g;
  let m, consumed="";
  while((m=re.exec(header))){
    specs.push({name:m[1],from:m[2],to:m[3]});
    consumed+=m[0]+" ";
  }
  if(!specs.length) throw new Error("line "+lineNo+": sum needs n=1..N");
  const rest=header.replace(re,"").trim();
  if(rest) throw new Error("line "+lineNo+": could not parse sum header near '"+rest+"'");
  return specs.map(sp=>{
    if(RESERVED.has(sp.name)) throw new Error("line "+lineNo+": reserved index name '"+sp.name+"'");
    let a=Math.round(evalIndexExpr(sp.from,{}));
    let b=/^(Infinity|\*|inf)$/i.test(sp.to)?ceilLimit:Math.round(evalIndexExpr(sp.to,{}));
    if(!Number.isFinite(a)||!Number.isFinite(b)) throw new Error("line "+lineNo+": finite sum bounds required");
    if(b<a) [a,b]=[b,a];
    if(b-a+1>ceilLimit) b=a+ceilLimit-1;
    return {name:sp.name,from:a,to:b};
  });
}
function expandSum(rhs,ceilLimit,lineNo){
  const trimmed=rhs.trim();
  if(!/^sum\s+/.test(trimmed)) return jsExpr(trimmed);
  const m=trimmed.match(/^sum\s+(.+?)\s*:\s*([\s\S]+)$/);
  if(!m) throw new Error("line "+lineNo+": malformed sum");
  const specs=parseIndexSpecs(m[1],ceilLimit,lineNo);
  let body=m[2].trim(), where="";
  const wi=body.search(/\s+where\s+/);
  if(wi>=0){ where=body.slice(wi+7).trim(); body=body.slice(0,wi).trim(); }
  const terms=[];
  function walk(i,vars){
    if(i===specs.length){
      if(!where || evalIndexPred(where,vars)) terms.push("("+subVars(jsExpr(body),vars)+")");
      return;
    }
    const sp=specs[i];
    for(let v=sp.from;v<=sp.to;v++) walk(i+1,{...vars,[sp.name]:v});
  }
  walk(0,{});
  if(!terms.length) return "0";
  return "("+terms.join("+")+")";
}
/* cut : r : depth : Q - a zero over the woven output. Moire is where this is
   not sugar: its sidebands are emergent, produced by the interference rather
   than written down, so there is no line whose amplitude could be scaled to
   reach one. A series zero after the sum is the only way to sculpt them. */
function parseCut(line,lineNo){
  const c=line.replace(/^cut\b/i,"").replace(/^\s*:/,"").split(":").map(x=>x.trim());
  const r=Number(evalIndexExpr(c[0],{}));
  if(!(r>0)) throw new Error("line "+lineNo+": cut needs a ratio > 0");
  const depth=c.length>1?Number(evalIndexExpr(c[1],{})):1;
  const q=c.length>2?Number(evalIndexExpr(c[2],{})):30;
  if(!isFinite(q)||q<=0) throw new Error("line "+lineNo+": cut needs a finite Q > 0");
  return {ratio:r,depth:isFinite(depth)?depth:1,q:Math.max(.5,q)};
}
function parseProgram(text,ceilLimit,cuts){
  const lines=[];
  text.split(/\r?\n/).forEach((raw,idx)=>{
    const line=stripComment(raw);
    if(!line) return;
    if(/^cut\b/i.test(line)){ if(cuts) cuts.push(parseCut(line,idx+1)); return; }
    const colon=line.indexOf(":");
    if(colon>0){
      const lhs=line.slice(0,colon).trim();
      if(/^[A-Za-z_]\w*$/.test(lhs)){
        if(RESERVED.has(lhs)) throw new Error("line "+(idx+1)+": reserved signal name '"+lhs+"'");
        lines.push({name:lhs,expr:line.slice(colon+1).trim(),lineNo:idx+1});
        return;
      }
    }
    lines.push({name:"y",expr:line,lineNo:idx+1});
  });
  if(!lines.length) throw new Error(cuts&&cuts.length?"a cut needs something to cut - write a weave too":"empty weave");
  const seen=new Set();
  for(const ln of lines){
    if(seen.has(ln.name)) throw new Error("line "+ln.lineNo+": duplicate signal '"+ln.name+"'");
    seen.add(ln.name);
  }
  return lines;
}
function replaceSignalRefs(expr,names,currentIndex){
  let out=expr;
  names.forEach((name,j)=>{
    if(j>=currentIndex){
      out=out.replace(new RegExp("\\b"+escRE(name)+"\\b","g"),"S["+j+"]");
    }
  });
  return out;
}
function instrumentOps(expr,counter){
  return expr.replace(/\bop\s*\(/g,()=>{ const i=counter.n++; return "OP("+i+","; });
}
function compileProgram(text,ceilArg){
  const ceilLimit=Math.min(96,Math.max(1,parseInt(ceilArg,10)||40));   // the page reads the control; this takes the number
  const cuts=[];
  const lines=parseProgram(text,ceilLimit,cuts);
  const names=lines.map(l=>l.name);
  const outputIndex=names.includes("y")?names.indexOf("y"):names.length-1;
  const opCounter={n:0};
  const code=[];
  lines.forEach((ln,i)=>{
    let ex=expandSum(ln.expr,ceilLimit,ln.lineNo);
    ex=foldConstCalls(ex);
    ex=replaceSignalRefs(ex,names,i);
    ex=instrumentOps(ex,opCounter);
    code.push("let "+ln.name+"=Number("+ex+"); if(!Number.isFinite("+ln.name+")) "+ln.name+"=0;");
  });
  names.forEach((name,i)=>code.push("S["+i+"]="+name+";"));
  const outName=names[outputIndex];
  const ownsEnv=lines.some(l=>/\bt\b/.test(stripComment(l.expr)));
  // Carrier phase integrates a per-op accumulator (PH[i]) instead of sin(2π r f0 t):
  // when r or f0 varies (drift, glide, r(t)) a stateless t-multiply accrues phase
  // error linear in note age; integrating dphi = 2π r f0 dt keeps it exact.
  const source=`"use strict";  // compiled with BANK = this voice's signal bank
${PRELUDE}
return function(t,f0,state,idxMul,driftDepth,driftRate,dt){
  const S=state.s, PH=state.ph;
  function OP(i,r,p){
    r=Number(r); p=Number(p||0);
    if(!Number.isFinite(r)) r=0;
    let cents=0;
    if(driftDepth){
      cents=(state.rnd[i]||0)*driftDepth + Math.sin(tau*driftRate*t + (state.lfo[i]||0))*driftDepth*.35;
    }
    const rr=r*Math.pow(2,cents/1200);
    PH[i]=(PH[i]+tau*rr*f0*dt)%tau;
    return Math.sin(PH[i] + p*idxMul);
  }
  ${code.join("\n  ")}
  let out=${outName};
  if(!Number.isFinite(out)) out=0;
  return Math.max(-2,Math.min(2,out));
}`;
  const fn=(new Function("BANK",source))(FOLD_BANK);
  return {source,fn,cuts,lineCount:lines.length,opCount:opCounter.n,output:outName,ownsEnv,ceil:ceilLimit,names,
    lines:lines.map(l=>({name:l.name,expr:l.expr})),outputName:outName};
}

function setPatchSeed(v){ PATCH_SEED=(v>>>0); }
function getPatchSeed(){ return PATCH_SEED; }
function getBuildBank(){ return buildBank; }

export { RESERVED, PRELUDE, stripComment, jsExpr, compileProgram, parseProgram, parseCut,
         FILES, fileNames, filePayload, filesChanged, reseedBuild,
         nextVoiceSeed, resetVoiceCounter, rnd, noise,
         setPatchSeed, getPatchSeed, getBuildBank, FOLD_BANK };
