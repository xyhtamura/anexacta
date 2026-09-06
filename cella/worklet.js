/* The resonator bank, one AudioWorkletProcessor. Loaded by URL rather than as
   a Blob so this import resolves - a blob has no base to resolve against, which
   is why the signal block used to be pasted in here. */
import { mulberry32, hash32, perlin1, makeFileSource, makeWaveSource,
         SIGNALS, SIGKEYS, makeSignalBank, voiceSeed } from "./signals.js";

/* mini expr evaluator for r(t)/q(t) in the audio thread (ported from aliquoto) */
function clip01(x){return Math.max(0,Math.min(1,isFinite(x)?x:0));}
const WP=(()=>{const a=[],lim=4000,s=new Uint8Array(lim).fill(1);for(let i=2;i<lim;i++){if(s[i]){a.push(i);for(let j=i*i;j<lim;j+=i)s[j]=0;}}return a;})();
function wprime(n){n=Math.max(1,Math.round(n));return WP[n-1]||WP[WP.length-1];}
function wfib(n){n=Math.max(1,Math.round(n));let a=1,b=1;for(let i=2;i<n;i++){const c=a+b;a=b;b=c;}return b;}

/* Populated once per AudioWorkletGlobalScope - that is, once per audio context
   - by whichever voice carried the payload. */
const FILEBANK={};
function lookupFile(name){ return (a,b)=>{ const f=FILEBANK[name]; return f?f(a,b):0; }; }
const WDEFAULT=makeSignalBank(1);
function rnd(a,b){ return WDEFAULT.rnd(a,b); }
function noise(x){ return WDEFAULT.noise(x); }
const WENV={prime:wprime,fib:wfib,rnd,noise,sin:Math.sin,cos:Math.cos,tan:Math.tan,exp:Math.exp,log:Math.log,
  sqrt:Math.sqrt,pow:Math.pow,abs:Math.abs,floor:Math.floor,round:Math.round,sign:Math.sign,
  min:Math.min,max:Math.max,pi:Math.PI,e:Math.E,tau:2*Math.PI,phi:(1+Math.sqrt(5))/2,
  iff:(c,a,b)=>c?a:b, odd:n=>(Math.round(n)%2!==0)?1:0, even:n=>(Math.round(n)%2===0)?1:0,
  not:x=>x?0:1, clamp:(x,lo,hi)=>Math.min(hi,Math.max(lo,x)), step:(edge,x)=>x>=edge?1:0,
  between:(x,lo,hi)=>(x>=lo&&x<=hi)?1:0, mod:(a,b)=>((a%b)+b)%b, clip01};
const WKEYS=Object.keys(WENV), WVALS=WKEYS.map(k=>WENV[k]);
function wcompile(expr,vars,bank){ expr=String(expr).split("**").join("^").split("^").join("**");
  const env=Object.assign({},WENV); if(bank) Object.assign(env,bank);
  const keys=Object.keys(env), vals=keys.map(k=>env[k]);
  const fn=new Function(...vars,...keys,"return ("+expr+");");
  return (...v)=>fn(...v,...vals); }
function mkDyn(P,bank){ return P.map(pt=>{ const d=pt.dyn; if(!d)return null;
  return { r:d.r?wcompile(d.r.expr,d.r.vars,bank):null, rV:d.r?d.r.vals:null,
           q:d.q?wcompile(d.q.expr,d.q.vars,bank):null, qV:d.q?d.q.vals:null }; }); }
class Cella extends AudioWorkletProcessor{
  static get parameterDescriptors(){ return [{name:'f0',defaultValue:130,minValue:0,maxValue:20000,automationRate:'a-rate'}]; }
  constructor(o){ super(); const p=o.processorOptions;
    this.P=p.parts; this.common=p.common; this.pink=p.pink;
    this.E=p.adsr; this.t0=p.startAt||currentTime; this.f0hint=p.f0hint||130;
    this.det=p.det&&p.det.length?p.det:[0]; this.K=this.det.length;
    if(p.fileData) for(const k in p.fileData) FILEBANK[k]=p.fileData[k]?(/^wave/.test(k)?makeWaveSource(p.fileData[k]):makeFileSource(p.fileData[k])):null;
    const refs={}; if(p.files) for(const k in p.files) refs[k]=lookupFile(k);
    this.bank=makeSignalBank(p.seed==null?1:p.seed,refs);   // one bank per voice
    this.dyn=mkDyn(this.P,this.bank); this.qMul=p.qMul||1;
    /* The drive is noise, so seeding it is what makes a cella render repeat at
       all - the resonators are deterministic given the same excitation. */
    this.wsrc=mulberry32(hash32((p.seed==null?1:p.seed)+0x2545F491));
    const spread=mulberry32(hash32((p.seed==null?1:p.seed)+0x5F356495));
    this.dC=p.driftC||0; this.dR=p.driftR||0;
    this.C=p.cuts||[]; this.cre=new Float64Array(this.C.length); this.cim=new Float64Array(this.C.length);
    this.cdyn=this.C.map(c=>c.dyn?{r:c.dyn.r?wcompile(c.dyn.r.expr,c.dyn.r.vars,this.bank):null,rV:c.dyn.r?c.dyn.r.vals:null,
      q:c.dyn.q?wcompile(c.dyn.q.expr,c.dyn.q.vars,this.bank):null,qV:c.dyn.q?c.dyn.q.vals:null}:null);
    this.rnd=this.P.map(()=>spread()*2-1); this.lfo=this.P.map(()=>spread()*6.283185307);
    this.n=this.P.length; const NK=this.n*this.K;
    this.xbuf=p.exciteSamples||null; this.xlen=this.xbuf?this.xbuf.length:0; this.xRate=p.exciteRate||sampleRate;
    this.xOff=this.xlen?new Float64Array(NK):null;
    if(this.xOff && !this.common){ for(let i=0;i<NK;i++) this.xOff[i]=spread()*this.xlen; }
    this.re=new Float64Array(NK); this.im=new Float64Array(NK);
    // seed pure-sine modes (sub 0 only) at amplitude·phase; driven modes start at rest
    for(let k=0;k<this.n;k++){ if(!isFinite(this.P[k].q)){ const i0=k*this.K;
      this.re[i0]=this.P[k].amp*Math.cos(this.P[k].phase||0); this.im[i0]=this.P[k].amp*Math.sin(this.P[k].phase||0); } }
    this.pk=[]; if(!this.xlen&&this.pink&&!this.common){ for(let i=0;i<NK;i++) this.pk.push(new Float64Array(7)); }
    this.pkC=new Float64Array(7);
    this.norm=this.P.reduce((s,x)=>s+Math.abs(x.amp),0)||1;
    this.relAt=null; this.killAt=Infinity; this.dead=false;
    // scheduled / offline notes carry their own release time (no live message)
    if(p.relAt!=null){ this.relAt=p.relAt; this.killAt=p.relAt+this.ringTail()+0.1; }
    this.port.onmessage=e=>{ const d=e.data||{};
      if(d==='stop'||d.type==='stop') this.dead=true;
      else if(d.type==='adsr'){ this.E=d.adsr; }
      else if(d.type==='release'){ const at=d.at||currentTime; this.relAt=at; this.killAt=at+this.ringTail()+0.1; }
    };
  }
  // tail: sine modes lift over R; driven modes ring ~6·tau at their own Q (clamped)
  ringTail(){ let tail=this.E.r;
    for(let k=0;k<this.n;k++){ const q=this.P[k].q; if(isFinite(q)){ const hz=this.f0hint*this.P[k].ratio; const gamma=Math.PI*hz/q; if(gamma>0) tail=Math.max(tail, 6/gamma); } }
    return Math.min(16,tail); }
  white(){ return this.wsrc()*2-1; }
  pinkOf(b,w){ // Paul Kellet pink filter
    b[0]=0.99886*b[0]+w*0.0555179; b[1]=0.99332*b[1]+w*0.0750759; b[2]=0.96900*b[2]+w*0.1538520;
    b[3]=0.86650*b[3]+w*0.3104856; b[4]=0.55000*b[4]+w*0.5329522; b[5]=-0.7616*b[5]-w*0.0168980;
    const o=b[0]+b[1]+b[2]+b[3]+b[4]+b[5]+b[6]+w*0.5362; b[6]=w*0.115926; return o*0.18;
  }
  fileAtTime(t,off){
    if(!this.xlen)return 0;
    let pos=(t*this.xRate+(off||0))%this.xlen; if(pos<0)pos+=this.xlen;
    const i0=pos|0, i1=(i0+1)%this.xlen, f=pos-i0;
    return this.xbuf[i0]+(this.xbuf[i1]-this.xbuf[i0])*f;
  }
  gate(t){ const e=this.E, age=t-this.t0; let g;
    if(age<0) g=0; else if(age<e.a) g=age/e.a; else if(age<e.a+e.d) g=1+(e.s-1)*((age-e.a)/e.d); else g=e.s;
    if(this.relAt!=null && t>=this.relAt){ g*=Math.max(0, 1-(t-this.relAt)/e.r); }
    return g;
  }
  process(_,outs,params){ if(this.dead)return false; const out=outs[0][0]; if(!out)return true;
    const sr=sampleRate, N=out.length, P=this.P, n=this.n, K=this.K, det=this.det, f0a=params.f0, TAU=6.283185307;
    const f0=f0a[0];
    // per-block poles + drive gain, per sub-pole (r(t)/q(t) evaluated at block time)
    const NK=n*K, pr=new Float64Array(NK), pi=new Float64Array(NK), g=new Float64Array(NK), sine=new Uint8Array(n);
    const bAge=currentTime-this.t0, bt=currentTime;
    for(let k=0;k<n;k++){ let ratio=P[k].ratio, q=P[k].q; const dy=this.dyn[k];
      if(dy){ if(dy.r){ const v=dy.r(...dy.rV,bAge); if(isFinite(v)&&v>0)ratio=v; }
        if(dy.q){ const v=dy.q(...dy.qV,ratio,f0*ratio,f0,bAge); if(isFinite(v))q=Math.min(8000,Math.max(.5,v*this.qMul)); } }
      let dc=this.rnd[k]*this.dC; if(this.dR>0)dc+=Math.sin(TAU*this.dR*bt+this.lfo[k])*this.dC;
      const isSine=!isFinite(q), base=f0*ratio;
      sine[k]=isSine?1:0;
      const lim=isSine?1:K, gscale=1/Math.sqrt(lim);
      for(let j=0;j<lim;j++){ const idx=k*K+j, hz=base*Math.pow(2,(det[j]+dc)/1200), w=TAU*hz/sr;
        if(isSine){ pr[idx]=Math.cos(w); pi[idx]=Math.sin(w); g[idx]=0; }
        else { const gamma=Math.PI*hz/q, rr=Math.exp(-gamma/sr);
          /* signed, not |amp|: a negative line drives in antiphase, which is the
             parallel subtract. It only cancels against a correlated response, so
             it needs common drive - under independent drive two uncorrelated
             streams add power instead. Sine modes were always signed here. */
          pr[idx]=rr*Math.cos(w); pi[idx]=rr*Math.sin(w); g[idx]=P[k].amp*Math.sqrt(Math.max(0,1-rr*rr))*3.2*gscale; } }
    }
    /* zeros: unity-gain bandpass at the centre, subtracted from the bank output.
       (1-rr) is what makes the bandpass unity at resonance, so depth 1 removes
       the band outright and depth < 1 scoops it. Feedforward - each zero reads
       the signal handed to it, never its own output - so it cannot ring. */
    const nc=this.C.length, cpr=new Float64Array(nc), cpi=new Float64Array(nc), cg=new Float64Array(nc);
    for(let c=0;c<nc;c++){ let ratio=this.C[c].ratio, q=this.C[c].q; const dy=this.cdyn[c];
      if(dy){ if(dy.r){ const v=dy.r(...dy.rV,bAge); if(isFinite(v)&&v>0)ratio=v; }
        if(dy.q){ const v=dy.q(...dy.qV,ratio,f0*ratio,f0,bAge); if(isFinite(v))q=Math.min(8000,Math.max(.5,v)); } }
      const hz=f0*ratio, w=TAU*hz/sr, rr=Math.exp(-Math.PI*hz/q/sr);
      /* 2*(1-rr), not (1-rr): a real input splits into e^{+jwn} and e^{-jwn} and
         the resonator answers only one of them, so its in-phase output at the
         centre is half the input. The factor of two is what makes depth 1 a null
         rather than a 6 dB dip. */
      cpr[c]=rr*Math.cos(w); cpi[c]=rr*Math.sin(w); cg[c]=2*(1-rr)*this.C[c].depth; }
    for(let i=0;i<N;i++){ const t=currentTime+i/sr, gt=this.gate(t); let s=0;
      let nzC=0; if(this.common){ nzC=this.xlen?this.fileAtTime(t,0):this.white(); if(!this.xlen&&this.pink) nzC=this.pinkOf(this.pkC,nzC); }
      for(let k=0;k<n;k++){ const isSine=sine[k], lim=isSine?1:K;
        for(let j=0;j<lim;j++){ const idx=k*K+j; let drv=0;
          if(!isSine){ const nz=this.common?nzC:(this.xlen?this.fileAtTime(t,this.xOff[idx]):(this.pink?this.pinkOf(this.pk[idx],this.white()):this.white())); drv=g[idx]*gt*nz; }
          const re=this.re[idx], im=this.im[idx];
          this.re[idx]=pr[idx]*re - pi[idx]*im + drv; this.im[idx]=pr[idx]*im + pi[idx]*re;
          s += isSine ? gt*this.im[idx] : this.im[idx];
        }
      }
      let y=s/this.norm;
      for(let c=0;c<nc;c++){ const re=this.cre[c], im=this.cim[c];
        this.cre[c]=cpr[c]*re - cpi[c]*im + y; this.cim[c]=cpr[c]*im + cpi[c]*re;
        y -= cg[c]*this.cre[c]; }
      out[i]=y;
    }
    if(currentTime>this.killAt) return false;
    return true;
  }
}
registerProcessor('cella',Cella);
