/* ---------- sound analysis - suite arc 1.2 ----------
   Analysis runs once, on load, on the main thread; only the lookup crosses into
   the worklet, and that half is in the shared signal block. The grid is
   log-spaced - 12 bands to the octave from A0 - rather than linear FFT bins,
   because the question asked of it is "how much energy is at this partial's hz",
   and a partial's hz is musical. A linear grid would give a semitone at the
   bottom of the range a fraction of a bin and a semitone at the top hundreds. */
const AN_FFT=2048, AN_HOP=512, AN_BPO=12, AN_FMIN=27.5, AN_MAXSEC=180, AN_WAVESEC=30;
function fftMag(re,im,n){                       // in-place radix-2, returns magnitudes in re
  for(let i=1,j=0;i<n;i++){ let b=n>>1; for(;j&b;b>>=1) j^=b; j^=b;
    if(i<j){ let t=re[i];re[i]=re[j];re[j]=t; t=im[i];im[i]=im[j];im[j]=t; } }
  for(let len=2;len<=n;len<<=1){ const ang=-2*Math.PI/len, wr=Math.cos(ang), wi=Math.sin(ang);
    for(let i=0;i<n;i+=len){ let cr=1,ci=0;
      for(let k=0;k<len/2;k++){ const ur=re[i+k],ui=im[i+k];
        const vr=re[i+k+len/2]*cr-im[i+k+len/2]*ci, vi=re[i+k+len/2]*ci+im[i+k+len/2]*cr;
        re[i+k]=ur+vr; im[i+k]=ui+vi; re[i+k+len/2]=ur-vr; im[i+k+len/2]=ui-vi;
        const nr=cr*wr-ci*wi; ci=cr*wi+ci*wr; cr=nr; } } }
  for(let i=0;i<n;i++) re[i]=Math.hypot(re[i],im[i]);
  return re;
}
function analyzeSound(mono,rate){
  const n=Math.min(mono.length,Math.floor(AN_MAXSEC*rate));
  const nFrames=Math.max(1,Math.floor((n-AN_FFT)/AN_HOP)+1);
  const nyq=rate/2, fmax=Math.min(20000,nyq);
  const logMin=Math.log2(AN_FMIN);
  const nBands=Math.max(1,Math.ceil((Math.log2(fmax)-logMin)*AN_BPO)+1);
  const bands=new Float32Array(nFrames*nBands), follow=new Float32Array(nFrames);
  const win=new Float32Array(AN_FFT);
  for(let i=0;i<AN_FFT;i++) win[i]=0.5-0.5*Math.cos(2*Math.PI*i/AN_FFT);
  const re=new Float32Array(AN_FFT), im=new Float32Array(AN_FFT);
  // which band each FFT bin lands in, precomputed once
  const binBand=new Int32Array(AN_FFT/2);
  for(let k=1;k<AN_FFT/2;k++){ const hz=k*rate/AN_FFT;
    const b=Math.round((Math.log2(hz)-logMin)*AN_BPO);
    binBand[k]=(hz<AN_FMIN||hz>fmax||b<0||b>=nBands)?-1:b; }
  let bMax=0,fMax=0;
  for(let f=0;f<nFrames;f++){ const off=f*AN_HOP;
    let sum=0;
    for(let i=0;i<AN_FFT;i++){ const s=off+i<n?mono[off+i]:0; sum+=s*s; re[i]=s*win[i]; im[i]=0; }
    follow[f]=Math.sqrt(sum/AN_FFT); if(follow[f]>fMax) fMax=follow[f];
    const mag=fftMag(re,im,AN_FFT), row=f*nBands;
    for(let k=1;k<AN_FFT/2;k++){ const b=binBand[k]; if(b>=0) bands[row+b]+=mag[k]*mag[k]; }
    for(let b=0;b<nBands;b++){ const v=Math.sqrt(bands[row+b]); bands[row+b]=v; if(v>bMax) bMax=v; } }
  if(bMax>0) for(let i=0;i<bands.length;i++) bands[i]/=bMax;
  if(fMax>0) for(let i=0;i<follow.length;i++) follow[i]/=fMax;
  const wn=Math.min(n,Math.floor(AN_WAVESEC*rate));
  return {bands,follow,nBands,nFrames,frameRate:rate/AN_HOP,logMin,bpo:AN_BPO,
          wave:mono.slice(0,wn),waveRate:rate,waveSeconds:wn/rate,
          seconds:n/rate,truncated:n<mono.length};
}
function monoOf(buf){ const n=buf.length, ch=buf.numberOfChannels, m=new Float32Array(n);
  for(let c=0;c<ch;c++){ const d=buf.getChannelData(c); for(let i=0;i<n;i++) m[i]+=d[i]/ch; }
  return m; }
/* ---------- end sound analysis ---------- */
export { AN_FFT, AN_HOP, AN_BPO, AN_FMIN, AN_MAXSEC, AN_WAVESEC,
         fftMag, analyzeSound, monoOf };
