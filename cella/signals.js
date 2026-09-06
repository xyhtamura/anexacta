/* ---------- signal sources - suite arc 1.1 ----------
   One registry: name -> factory(seed) -> the callable the grammar sees. Every
   voice builds its own bank, so a note replays identically instead of drawing
   fresh entropy each time, and guests that carry data (a dropped file, arc 1.2)
   join the same bank rather than growing a second path. This file is imported by
   both the page and the worklet, so there is exactly one copy of it and the two
   cannot disagree. It used to be duplicated text held together by a checker. */
function mulberry32(s){ let a=s>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash32(x){ x=Math.imul((x>>>0)^0x9E3779B9,0x85EBCA6B); x^=x>>>13; x=Math.imul(x,0xC2B2AE35); return (x^x>>>16)>>>0; }
function grad1(i,seed){ return hash32(Math.imul(i|0,1836311903)^seed)/2147483648-1; }
function perlin1(x,seed){ if(!isFinite(x))return 0; const i=Math.floor(x),f=x-i,u=f*f*f*(f*(f*6-15)+10);
  const a=grad1(i,seed)*f, b=grad1(i+1,seed)*(f-1); return 2*(a+(b-a)*u); }
/* A dropped file read as numbers rather than as audio (arc 1.2). Two call
   shapes, one question each: f(t) is the loudness follower, f(hz,t) is the
   energy in the band at hz - which is the keyfollow vocoder, since a partial
   asks about its own hz and its hz follows the played note. Both come back
   0..1 over the whole file, so either can be used as a gain unscaled. t is note
   age, like every other t in the grammar, so each note reads from the start. */
function makeFileSource(A){
  const B=A.bands, nb=A.nBands|0, nf=A.nFrames|0, fr=A.frameRate, fol=A.follow;
  const lo=A.logMin, bpo=A.bpo;
  const at=t=>{ const x=t*fr; return x<=0?0:(x>=nf-1?nf-1:x); };
  const follow=t=>{ if(nf<1)return 0; const x=at(t),i=x|0,j=i+1<nf?i+1:i;
    return fol[i]+(fol[j]-fol[i])*(x-i); };
  const band=(hz,t)=>{ if(nf<1||!(hz>0))return 0;
    const y=(Math.log2(hz)-lo)*bpo; if(y<0||y>nb-1)return 0;
    const x=at(t),i=x|0,j=i+1<nf?i+1:i,fx=x-i;
    const k=y|0,l=k+1<nb?k+1:k,fy=y-k;
    const p=B[i*nb+k]+(B[i*nb+l]-B[i*nb+k])*fy;
    const q=B[j*nb+k]+(B[j*nb+l]-B[j*nb+k])*fy;
    return p+(q-p)*fx; };
  return (p,q)=>q===undefined?follow(p):band(p,q);
}
/* The same file read as a waveform rather than as a measurement. This is the one
   shape that carries the file's own signal rather than a description of it, so
   it is what phase-modulation cross-synthesis wants: the sound itself becomes the
   modulator. Linear interpolation, silence outside the file, and it stops at
   whatever the loader kept - a waveform costs about 176 KB per second where the
   analysis costs 40, so the loader keeps less of it. */
function makeWaveSource(A){
  const w=A.wave, rate=A.waveRate, n=w?w.length:0;
  return t=>{ if(!n)return 0; const x=t*rate; if(x<0||x>=n-1)return 0;
    const i=x|0, f=x-i; return w[i]+(w[i+1]-w[i])*f; };
}
const SIGNALS={
  rnd:seed=>{ const g=mulberry32(seed); return (a,b)=>{ const u=g(); if(a==null)return u; if(b==null){b=a;a=0;} return a+u*(b-a); }; },
  noise:seed=>x=>perlin1(x,seed)
};
const SIGKEYS=Object.keys(SIGNALS);
/* sources: {name: analysis record} for dropped files, shared by every voice. */
function makeSignalBank(seed,sources){ const bank={};
  SIGKEYS.forEach((k,i)=>{ bank[k]=SIGNALS[k](hash32((seed>>>0)+Math.imul(i+1,0x9E3779B9))); });
  if(sources) for(const k in sources){ const v=sources[k];   // a source is an analysis record, a callable, or nothing
    bank[k]=typeof v==="function"?v:(v?(/^wave/.test(k)?makeWaveSource(v):makeFileSource(v)):()=>0); }   // an empty slot reads 0, so a patch survives clearing the file
  return bank; }
function voiceSeed(patchSeed,hz,n){ return hash32(((patchSeed>>>0)^Math.imul(Math.round((hz||0)*100)|0,2654435761)^Math.imul((n|0)+1,0x27D4EB2F))>>>0); }
/* ---------- end signal sources ---------- */
export { mulberry32, hash32, grad1, perlin1, makeFileSource, makeWaveSource,
         SIGNALS, SIGKEYS, makeSignalBank, voiceSeed };
