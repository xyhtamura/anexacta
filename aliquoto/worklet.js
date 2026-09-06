/* The additive voice, one AudioWorkletProcessor. Loaded by URL rather than as
   a Blob so that this import resolves - a blob has no base to resolve against,
   which is the whole reason the signal block used to be pasted in here. */
import { mulberry32, hash32, perlin1, makeFileSource, makeWaveSource,
         SIGNALS, SIGKEYS, makeSignalBank, voiceSeed } from "./signals.js";

function clip01(x){return Math.max(0,Math.min(1,isFinite(x)?x:0));}
const WPRIMES=(()=>{const a=[],lim=4000,s=new Uint8Array(lim).fill(1);for(let i=2;i<lim;i++){if(s[i]){a.push(i);for(let j=i*i;j<lim;j+=i)s[j]=0;}}return a;})();
function prime(n){n=Math.max(1,Math.round(n));return WPRIMES[n-1]||WPRIMES[WPRIMES.length-1];}
function fib(n){n=Math.max(1,Math.round(n));let a=1,b=1;for(let i=2;i<n;i++){const c=a+b;a=b;b=c;}return b;}

/* Populated once per AudioWorkletGlobalScope - that is, once per audio context
   - by whichever voice carried the payload. */
const FILEBANK={};
function lookupFile(name){ return (a,b)=>{ const f=FILEBANK[name]; return f?f(a,b):0; }; }
const WDEFAULT=makeSignalBank(1);
function rnd(a,b){ return WDEFAULT.rnd(a,b); }
function noise(x){ return WDEFAULT.noise(x); }
function adsrShape(t,a,d,s,r){t=Math.max(0,t);a=Math.max(.0001,a);d=Math.max(.0001,d);s=clip01(s);if(t<a)return t/a;if(t<a+d)return 1+(s-1)*((t-a)/d);return s;}
const WENV={prime,fib,rnd,noise,sin:Math.sin,cos:Math.cos,tan:Math.tan,exp:Math.exp,log:Math.log,
  sqrt:Math.sqrt,pow:Math.pow,abs:Math.abs,floor:Math.floor,round:Math.round,sign:Math.sign,
  min:Math.min,max:Math.max,pi:Math.PI,e:Math.E,tau:2*Math.PI,phi:(1+Math.sqrt(5))/2,
  iff:(c,a,b)=>c?a:b, odd:n=>(Math.round(n)%2!==0)?1:0, even:n=>(Math.round(n)%2===0)?1:0,
  not:x=>x?0:1, clamp:(x,lo,hi)=>Math.min(hi,Math.max(lo,x)), step:(edge,x)=>x>=edge?1:0,
  between:(x,lo,hi)=>(x>=lo&&x<=hi)?1:0, mod:(a,b)=>((a%b)+b)%b, clip01, adsrShape, adsr:adsrShape};
const WKEYS=Object.keys(WENV), WVALS=WKEYS.map(k=>WENV[k]);
function wcompile(expr,vars,bank){ expr=String(expr).split("**").join("^").split("^").join("**");
  const env=Object.assign({},WENV); if(bank) Object.assign(env,bank);
  const keys=Object.keys(env), vals=keys.map(k=>env[k]);
  const fn=new Function(...vars,...keys,"return ("+expr+");");
  return (...v)=>fn(...v,...vals); }
function dynCall(d,args){ try{ const v=d.fn(...args); return isFinite(v)?v:null; }catch(e){ return null; } }
class Additive extends AudioWorkletProcessor{
  static get parameterDescriptors(){ return [{name:'f0',defaultValue:440,minValue:0,maxValue:24000,automationRate:'a-rate'}]; }
  constructor(o){super();const p=o.processorOptions;
    this.P=p.parts;this.dc=p.driftCents||0;this.dr=p.driftRate||0;this.t0=p.startAt||currentTime;
    if(p.fileData) for(const k in p.fileData) FILEBANK[k]=p.fileData[k]?(/^wave/.test(k)?makeWaveSource(p.fileData[k]):makeFileSource(p.fileData[k])):null;
    const refs={}; if(p.files) for(const k in p.files) refs[k]=lookupFile(k);
    this.bank=makeSignalBank(p.seed==null?1:p.seed,refs);   // one bank per voice: the note replays as itself
    const spread=mulberry32(hash32((p.seed==null?1:p.seed)+0x5F356495));
    this.ph=this.P.map(x=>x.phase||0);this.rnd=this.P.map(()=>spread()*2-1);
    this.lfo=this.P.map(()=>spread()*6.28318);this.relAt=null;this.relLevel=this.P.map(()=>0);this.killAt=Infinity;
    this.expr=this.P.map(p=>({r:p.dyn&&p.dyn.r?{...p.dyn.r,fn:wcompile(p.dyn.r.expr,p.dyn.r.vars,this.bank)}:null,
      gains:(p.gains||[]).map(expr=>({expr,fn:wcompile(expr,["t","r","hz","f0","a"],this.bank)}))}));
    this.norm=this.P.reduce((s,x)=>s+Math.abs(x.amp),0)||1;this.dead=false;
    if(p.relAt!=null){
      this.relLevel=this.P.map((_,i)=>this.ads(i,p.relAt));
      this.relAt=p.relAt; this.killAt=p.relAt+this.P.reduce((m,p)=>Math.max(m,(p.adsr&&p.adsr.r)||0.02),0)+0.08;
    }
    this.port.onmessage=e=>{const d=e.data||{};
      if(d==='stop'||d.type==='stop')this.dead=true;
      else if(d.type==='release'){ const at=d.at||currentTime;
        this.relLevel=this.P.map((_,i)=>this.ads(i,at));
        this.relAt=at; this.killAt=at+this.P.reduce((m,p)=>Math.max(m,(p.adsr&&p.adsr.r)||0.02),0)+0.08; }
    };}
  ads(k,t){ const p=this.P[k],e=p.adsr||{a:.001,d:.001,s:1,r:.4},age=t-this.t0;
    if(age<0)return 0; const A=Math.max(.0001,e.a||.001),D=Math.max(.0001,e.d||.001),S=Math.max(0,Math.min(1,e.s==null?1:e.s));
    if(age<A)return age/A; if(age<A+D)return 1+(S-1)*((age-A)/D); return S; }
  penv(k,t){ if(this.relAt!=null && t>=this.relAt){
      const R=Math.max(.0001,(this.P[k].adsr&&this.P[k].adsr.r)||.02);
      return Math.max(0,this.relLevel[k]*(1-(t-this.relAt)/R)); }
    return this.ads(k,t); }
  process(_,outs,params){ if(this.dead)return false; const out=outs[0][0]; if(!out)return true;
    const sr=sampleRate,N=out.length,P=this.P,TAU=6.28318530718,f0a=params.f0;
    for(let i=0;i<N;i++){ const t=currentTime+i/sr; const f0=f0a.length>1?f0a[i]:f0a[0]; let s=0;
      for(let k=0;k<P.length;k++){ let c=this.rnd[k]*this.dc;
        if(this.dr>0) c+=Math.sin(TAU*this.dr*t+this.lfo[k])*this.dc;
        const age=t-this.t0, ex=this.expr[k]; let ratio=P[k].ratio;
        if(ex.r){ const v=dynCall(ex.r,[...(ex.r.vals||[]),age]); if(v!=null) ratio=Math.max(0,v); }
        const hz=f0*ratio, f=hz*Math.pow(2,c/1200), eg=this.penv(k,t);
        let g=1; for(const ge of ex.gains){ const v=dynCall(ge,[age,ratio,hz,f0,Math.abs(P[k].amp)]); if(v!=null) g*=clip01(v); }
        this.ph[k]+=TAU*f/sr; if(eg>0&&g>0) s+=P[k].amp*eg*g*Math.sin(this.ph[k]); }
      out[i]=s/this.norm; }
    if(currentTime>this.killAt) return false;
    return true; }
}
registerProcessor('additive',Additive);
