// /core/dictionary.js — Word loader + answer picker
(function(global){
  async function loadDWYL(url,opts){
    const r=await fetch(url);const t=await r.text();
    const set=new Set();const min=opts?.minLen||4,max=opts?.maxLen||7;
    const lines=t.split(/\r?\n/);
    for(const w0 of lines){
      const w=w0.trim().toUpperCase();
      if(w.length<min||w.length>max)continue;
      if(!/^[A-Z]+$/.test(w))continue;
      set.add(w);
    }
    return{allowedSet:set};
  }
  function pickToday(list){
    if(!list.length)return'WORD';
    const d=new Date();const seed=(d.getFullYear()*10000)+(d.getMonth()+1)*100+d.getDate();
    const idx=seed%list.length;return list[idx];
  }
  global.WordscendDictionary={loadDWYL,pickToday};
})(window);
