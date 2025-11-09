// /core/bloom.js — lightweight Bloom filter (client-side)
(function(global){
  function murmur32(str,seed){
    let h=seed|0;const c1=0xcc9e2d51,c2=0x1b873593;const bytes=new TextEncoder().encode(str);
    for(let i=0;i+4<=bytes.length;i+=4){
      let k=(bytes[i])|(bytes[i+1]<<8)|(bytes[i+2]<<16)|(bytes[i+3]<<24);
      k=Math.imul(k,c1);k=(k<<15)|(k>>>17);k=Math.imul(k,c2);
      h^=k;h=(h<<13)|(h>>>19);h=Math.imul(h,5)+0xe6546b64|0;
    }
    let rem=bytes.length&3,k1=0;
    if(rem){if(rem>=1)k1^=bytes[bytes.length-rem];
      if(rem>=2)k1^=bytes[bytes.length-rem+1]<<8;
      if(rem>=3)k1^=bytes[bytes.length-rem+2]<<16;
      k1=Math.imul(k1,c1);k1=(k1<<15)|(k1>>>17);k1=Math.imul(k1,c2);h^=k1;}
    h^=bytes.length;h^=h>>>16;h=Math.imul(h,0x85ebca6b);
    h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;return h>>>0;
  }
  function makeIdx(m,k,w){
    const h1=murmur32(w,0x9747b28c),h2=murmur32(w,0x5bd1e995);
    const out=new Array(k);for(let i=0;i<k;i++)out[i]=(h1+i*h2)%m;return out;
  }
  class Bloom{
    constructor(buf,m,k){this.bits=buf;this.m=m;this.k=k;}
    has(w){
      if(!/^[a-z]{4,7}$/.test(w))return false;
      for(let pos of makeIdx(this.m,this.k,w.toLowerCase())){
        const byte=pos>>>3,mask=1<<(pos&7);
        if((this.bits[byte]&mask)===0)return false;
      }return true;
    }
  }
  async function loadBloom(bin,meta){
    const[buf,mj]=await Promise.all([
      fetch(bin).then(r=>r.arrayBuffer()),
      fetch(meta).then(r=>r.json())
    ]);
    return new Bloom(new Uint8Array(buf),mj.m,mj.k);
  }
  global.WordscendBloom={loadBloom};
})(window);
