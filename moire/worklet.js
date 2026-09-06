/* The woven voice, one AudioWorkletProcessor. Loaded by URL rather than as a
   Blob so this import resolves - a blob has no base to resolve against, which
   is why the signal block used to be pasted in here. The voice function itself
   still arrives as a source string and is built with new Function("BANK", src),
   because moire compiles a whole weave into one function. */
import { mulberry32, hash32, perlin1, makeFileSource, makeWaveSource,
         SIGNALS, SIGKEYS, makeSignalBank, voiceSeed } from "./signals.js";

/* Populated once per AudioWorkletGlobalScope - that is, once per audio context
   - by whichever voice carried the payload. */
const FILEBANK={};
function lookupFile(name){ return (a,b)=>{ const f=FILEBANK[name]; return f?f(a,b):0; }; }

class MoireVoice extends AudioWorkletProcessor{
  constructor(options){
    super();
    const o=(options&&options.processorOptions)||{};
    this.configure(o);
    this.port.onmessage=e=>{
      const m=e.data||{};
      if(m.type==="release") this.release();
      if(m.type==="setf0") this.f0=+m.value||this.f0;
      if(m.type==="params"){
        this.idxMul=+m.idxMul; this.driftDepth=+m.driftDepth; this.driftRate=+m.driftRate;
        this.gain=+m.gain; this.adsr=m.adsr||this.adsr;
      }
      if(m.type==="panic") this.alive=false;
    };
  }
  configure(o){
    if(o.fileData) for(const k in o.fileData) FILEBANK[k]=o.fileData[k]?(/^wave/.test(k)?makeWaveSource(o.fileData[k]):makeFileSource(o.fileData[k])):null;
    const refs={}; if(o.files) for(const k in o.files) refs[k]=lookupFile(k);
    this.bank=makeSignalBank(o.seed==null?1:o.seed,refs);   // one bank per voice
    this.fn=o.source?(new Function("BANK",o.source))(this.bank):null;
    const spread=mulberry32(hash32((o.seed==null?1:o.seed)+0x5F356495));
    const lc=Math.max(1,o.lineCount||1), oc=Math.max(1,o.opCount||1);
    this.state={s:new Float64Array(lc),rnd:new Float64Array(oc),lfo:new Float64Array(oc),ph:new Float64Array(oc)};
    this.cuts=o.cuts||[]; this.cre=new Float64Array(this.cuts.length); this.cim=new Float64Array(this.cuts.length);
    for(let i=0;i<oc;i++){this.state.rnd[i]=spread()*2-1;this.state.lfo[i]=spread()*Math.PI*2}
    this.f0=+o.f0||220; this.vel=+o.vel||.8; this.gain=+o.gain||.7;
    this.idxMul=+o.idxMul; this.driftDepth=+o.driftDepth||0; this.driftRate=+o.driftRate||.2;
    this.adsr=o.adsr||{a:.01,d:.5,s:.4,r:1};
    // scheduled start/release in ctx-time seconds (used by offline MIDI render).
    // defaults: startAt 0 (sound now) / relAt Infinity (release only on message).
    this.startAt=+o.startAt||0; this.relAt=(o.relAt==null?Infinity:+o.relAt);
    this.t=0; this.env=0; this.stage="a"; this.stageT=0; this.relStart=0; this.alive=true;
  }
  release(){ if(this.stage!=="r"){this.stage="r";this.stageT=0;this.relStart=this.env;} }
  envStep(dt){
    const a=Math.max(0,this.adsr.a||0), d=Math.max(0,this.adsr.d||0), s=Math.max(0,Math.min(1,this.adsr.s==null?.4:this.adsr.s)), r=Math.max(.005,this.adsr.r||.2);
    this.stageT+=dt;
    if(this.stage==="a"){
      this.env=a?Math.min(1,this.stageT/a):1;
      if(this.env>=1){this.stage="d";this.stageT=0}
    }else if(this.stage==="d"){
      const u=d?Math.min(1,this.stageT/d):1;
      this.env=1+(s-1)*u;
      if(u>=1){this.stage="s";this.stageT=0;this.env=s}
    }else if(this.stage==="s"){
      this.env=s;
    }else{
      const u=Math.min(1,this.stageT/r);
      this.env=this.relStart*(1-u);
      if(u>=1||this.env<1e-4) this.alive=false;
    }
    return this.env;
  }
  /* Feedforward: each zero reads the signal handed to it, never its own output,
     so it cannot ring. 2*(1-rr) is the unity-gain scale at the centre - a real
     input splits into two exponentials and the resonator answers one, so half
     the factor would leave a 6 dB dip where depth 1 should be a null. Centre is
     f0*ratio, so a zero keyfollows the played note like everything else here. */
  applyCuts(y,dt){
    const C=this.cuts; if(!C.length) return y;
    const sr=1/dt, TAU=Math.PI*2;
    for(let c=0;c<C.length;c++){
      const hz=this.f0*C[c].ratio, w=TAU*hz/sr, rr=Math.exp(-Math.PI*hz/C[c].q/sr);
      const re=this.cre[c], im=this.cim[c];
      this.cre[c]=rr*Math.cos(w)*re - rr*Math.sin(w)*im + y;
      this.cim[c]=rr*Math.cos(w)*im + rr*Math.sin(w)*re;
      y -= 2*(1-rr)*C[c].depth*this.cre[c];
    }
    return y;
  }
  process(ins,outs){
    const L=outs[0][0], R=outs[0][1]||L, dt=1/sampleRate;
    for(let i=0;i<L.length;i++){
      const now=(currentFrame+i)/sampleRate;
      if(now<this.startAt){ L[i]=0; R[i]=0; continue; }
      if(this.relAt!==Infinity && now>=this.relAt) this.release();
      const g=this.envStep(dt);
      let y=this.fn&&this.alive?this.fn(this.t,this.f0,this.state,this.idxMul,this.driftDepth,this.driftRate,dt):0;
      y=this.applyCuts(y,dt);
      const v=Math.max(-1,Math.min(1,y*g*this.vel*this.gain*.28));
      L[i]=v; R[i]=v; this.t+=dt;
    }
    return this.alive;
  }
}
registerProcessor("moire-voice",MoireVoice);

