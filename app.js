
const $=id=>document.getElementById(id);
const ic=(n,c)=>`<svg class="ic ${c||''}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const DEF={font:'Lora',size:17,lh:'1.7',ps:8,ind:1.5,mg:64,al:'left'};
const KC={Character:'#ffb86b',Scene:'#a29bfe',Place:'#7bd88f',Idea:'#ff8fab'};
let S={lib:[],bk:{},hist:{}},cur=null,cc=null,db=null,base=null,timers={},LS='novel-studio-v2',view='w',sel=null,link=false,drag=null;
const uid=()=>Math.random().toString(36).slice(2,8);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const words=t=>((t||'').replace(/[\u0001\u0002]/g,'').trim().match(/\S+/g)||[]).length;
const B=()=>S.bk[cur],C=()=>B().ch[cc];
const setStat=t=>{const e=$('stat');e.title=t;e.className='dot '+(/Synced|Exported|restored/i.test(t)?'ok':/Saving|Connecting|Loading|Building/.test(t)?'busy':'off');e.innerHTML='<i class="d"></i><span class="stxt">'+esc(t.replace(' ✓',''))+'</span>'};
function mk(){return{fmt:{...DEF},order:[],ch:{},map:{n:[],e:[]}}}
function addBook(title){const id=uid();S.lib.push({id,title});S.bk[id]=mk();return id}
function addCh(){const id=uid();B().ch[id]={title:'Chapter '+(B().order.length+1),text:'',notes:'',done:false};B().order.push(id);return id}
let idbp=null;const idb=()=>idbp||(idbp=new Promise(r=>{try{const q=indexedDB.open('novel-studio',1);q.onupgradeneeded=()=>q.result.createObjectStore('kv');q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}}));
let lt=null;
function local(){clearTimeout(lt);lt=setTimeout(async()=>{const d=await idb();if(!d)return;try{d.transaction('kv','readwrite').objectStore('kv').put({S:{lib:S.lib,bk:S.bk},cur},'state')}catch(e){}},300)}
async function loadLocal(){let j=null;const d=await idb();
 if(d)j=await new Promise(r=>{try{const q=d.transaction('kv').objectStore('kv').get('state');q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)}catch(e){r(null)}});
 if(!j){try{j=JSON.parse(localStorage.getItem(LS))}catch(e){}}
 if(j&&j.S&&j.S.lib&&j.S.lib.length){S=j.S;S.hist={};cur=j.cur}}
function docData(id){if(id==='lib')return{lib:S.lib};const[k,n,c]=id.split('_'),b=S.bk[n];if(!b)return null;
 if(k==='m')return{fmt:b.fmt,order:b.order};if(k==='g')return b.map;if(k==='h')return S.hist[n+'_'+c]?{v:S.hist[n+'_'+c]}:null;return b.ch[c]?{...b.ch[c],ts:Date.now()}:null}
const pend=new Set();
function write(id){pend.delete(id);if(!db)return;const d=docData(id);if(!d)return;db.doc(base+'/'+id).set(d).then(()=>setStat('Synced ✓')).catch(()=>setStat('Saved on this device'))}
function save(id){local();setStat(db?'Saving…':'Saved on this device');pend.add(id);clearTimeout(timers[id]);timers[id]=setTimeout(()=>write(id),700)}
function flush(){[...pend].forEach(id=>{clearTimeout(timers[id]);write(id)})}
addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush()});
function saveAll(){save('lib');for(const n in S.bk){save('m_'+n);save('g_'+n);for(const c in S.bk[n].ch)save('c_'+n+'_'+c)}}
function delDoc(id){clearTimeout(timers[id]);pend.delete(id);if(db)db.doc(base+'/'+id).delete().catch(()=>{})}
function arm(b,fn){const o=b.dataset.o||(b.dataset.o=b.textContent);if(b.dataset.a){clearTimeout(b._t);b.dataset.a='';b.textContent=o;fn()}else{b.dataset.a=1;b.textContent='Tap again to confirm';b._t=setTimeout(()=>{b.dataset.a='';b.textContent=o},3000)}}
function applyFmt(){const f=B().fmt,r=document.documentElement.style;
 r.setProperty('--font',f.font+',Georgia,serif');r.setProperty('--fs',f.size+'px');r.setProperty('--lh',f.lh);
 r.setProperty('--ps',f.ps+'px');r.setProperty('--ind',f.ind+'em');r.setProperty('--mg',f.mg+'px');r.setProperty('--al',f.al);
 for(const k in DEF)$(k).value=f[k];syncSeg()}
function renderList(){const b=B();$('list').innerHTML=b.order.map((id,i)=>{const c=b.ch[id],a=id===cc;
 return `<div class="ch ${a?'act':''} ${c.done?'dn':''}" data-id="${id}" role="button" tabindex="0" ${a?'aria-current="true"':''}><span class="n">${c.done?ic('check'):i+1}</span><span class="t">${esc(c.title||'Untitled')}</span>${a?`<span class="mv"><button class="up" data-mv="-1" aria-label="Move up">${ic('chev')}</button><button data-mv="1" aria-label="Move down">${ic('chev')}</button></span>`:`<span class="w">${words(c.text)}</span>`}</div>`}).join('');
 $('tot').textContent='Book total: '+b.order.reduce((a,id)=>a+words(b.ch[id].text),0).toLocaleString()+' words';
 if(cc&&b.ch[cc])$('eb').textContent='Chapter '+(b.order.indexOf(cc)+1)}
function renderNovels(){$('nlist').innerHTML=S.lib.map(n=>`<button class="mi ${n.id===cur?'on':''}" data-n="${n.id}">${esc(n.title||'Untitled')}</button>`).join('')}
function toHtml(l){let b=0,i=0,o='';for(const ch of esc(l)){if(ch==='\u0001'){o+=b?'</b>':'<b>';b^=1}else if(ch==='\u0002'){o+=i?'</i>':'<i>';i^=1}else o+=ch}return o+(b?'</b>':'')+(i?'</i>':'')}
function openCh(id){if(cc&&cc!==id&&B().ch[cc])snap(cur,cc,'Auto',120000);cc=id;const c=C();$('ct').value=c.title;setDone();$('nt').value=c.notes||'';
 $('ed').innerHTML=c.text?c.text.split('\n').map(l=>`<div>${toHtml(l)}</div>`).join(''):'<div><br></div>';$('ed').classList.toggle('e',!c.text);
 renderList();count();$('side').classList.remove('open')}
function openBook(id,keep){cur=id;local();if(!B().order.length)addCh();renderNovels();$('title').value=S.lib.find(n=>n.id===id).title;applyFmt();if(!keep)sel=null;openCh(B().order.includes(cc)?cc:B().order[0]);drawMap()}
function count(){const n=words(C().text);$('wc').textContent=n.toLocaleString()+' words';$('pg').style.width=Math.min(100,n/20)+'%'}
function ser(k){if(k.nodeType===3)return k.textContent;if(k.nodeName==='BR')return'\n';
 const t=k.nodeName,m=(t==='B'||t==='STRONG')?'\u0001':(t==='I'||t==='EM')?'\u0002':'';let r='';k.childNodes.forEach(x=>r+=ser(x));return m+r+m+((t==='DIV'||t==='P')?'\n':'')}
function readEd(){let r='';$('ed').childNodes.forEach(k=>{r+=ser(k)+((k.nodeType===3||/^(B|I|STRONG|EM|SPAN)$/.test(k.nodeName))?'\n':'')});
 return r.replace(/\u00a0/g,' ').replace(/\u0001\u0001|\u0002\u0002/g,'').split('\n').map(l=>l.replace(/\s+$/,'')).filter(l=>l.replace(/[\u0001\u0002]/g,'').trim()).join('\n')}
$('addc').onclick=()=>{const id=addCh();save('m_'+cur);save('c_'+cur+'_'+id);openCh(id);setView('w');$('ed').focus()};
$('list').onclick=e=>{const mv=e.target.closest('[data-mv]');if(mv){const o=B().order,i=o.indexOf(cc),j=i+ +mv.dataset.mv;if(j<0||j>=o.length)return;[o[i],o[j]]=[o[j],o[i]];save('m_'+cur);return renderList()}
 const el=e.target.closest('.ch');if(el){openCh(el.dataset.id);setView('w')}};
$('ed').oninput=()=>{C().text=readEd();snap(cur,cc,'Auto',600000);$('ed').classList.toggle('e',!C().text);count();renderList();save('c_'+cur+'_'+cc)};
$('ed').addEventListener('paste',e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'))});
for(const[i,c]of[['bb','bold'],['ib','italic']]){$(i).onmousedown=e=>e.preventDefault();$(i).onclick=()=>{$('ed').focus();document.execCommand(c);$('ed').oninput()}}
$('ct').oninput=()=>{C().title=$('ct').value;renderList();save('c_'+cur+'_'+cc)};
$('nt').oninput=()=>{C().notes=$('nt').value;save('c_'+cur+'_'+cc)};
$('dc').onclick=()=>arm($('dc'),()=>{const b=B();if(b.order.length<2)return setStat('A novel needs at least one chapter');
 const i=b.order.indexOf(cc),id=cc;snap(cur,id,'Before delete',0);b.order.splice(i,1);delete b.ch[id];delDoc('c_'+cur+'_'+id);save('m_'+cur);openCh(b.order[Math.min(i,b.order.length-1)])});
$('deln').onclick=()=>arm($('deln'),()=>{if(S.lib.length<2)return setStat('Keep at least one novel');
 const n=cur,b=B();delDoc('m_'+n);delDoc('g_'+n);Object.keys(b.ch).forEach(c=>delDoc('c_'+n+'_'+c));Object.keys(S.hist).filter(k=>k.startsWith(n+'_')).forEach(k=>{delDoc('h_'+k);delete S.hist[k]});
 S.lib=S.lib.filter(x=>x.id!==n);delete S.bk[n];save('lib');openBook(S.lib[0].id)});
$('dn').onchange=()=>{C().done=$('dn').checked;renderList();save('c_'+cur+'_'+cc)};
$('title').oninput=()=>{const n=S.lib.find(n=>n.id===cur);n.title=$('title').value;renderNovels();save('lib')};

$('newn').onclick=()=>{const id=addBook('Untitled novel');addCh();cur=id;save('lib');save('m_'+id);openBook(id);$('title').focus()};
for(const k in DEF)$(k).oninput=()=>{const v=$(k).value;B().fmt[k]=['size','ps','ind','mg'].includes(k)?+v:v;applyFmt();save('m_'+cur)};
$('menu').onclick=()=>$('side').classList.toggle('open');
$('theme').onclick=()=>{const d=document.documentElement;d.dataset.theme=getComputedStyle(d).getPropertyValue('--bg').trim()==='#17161d'?'light':'dark'};
function setView(v){view=v;$('wv').style.display=v==='w'?'flex':'none';$('mv').style.display=v==='m'?'flex':'none';$('tw').classList.toggle('on',v==='w');$('tm').classList.toggle('on',v==='m');if(v==='m')drawMap()}
$('tw').onclick=()=>setView('w');$('tm').onclick=()=>setView('m');
/* ---------- UI chrome ---------- */
const closePops=()=>document.querySelectorAll('.pop').forEach(p=>p.hidden=true);
[['nbtn','nmenu'],['aa','fmt'],['mb','more']].forEach(([b,m])=>$(b).onclick=()=>{const was=$(m).hidden;closePops();$(m).hidden=!was});
document.addEventListener('click',e=>{document.querySelectorAll('.pop').forEach(p=>{if(!p.parentElement.contains(e.target))p.hidden=true});if(e.target.closest('.pop .mi:not(.arm)'))closePops()});
$('nlist').onclick=e=>{const b=e.target.closest('[data-n]');if(b)openBook(b.dataset.n)};
function syncSeg(){document.querySelectorAll('.seg').forEach(g=>{const v=$(g.dataset.for).value;g.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===v))})}
document.querySelectorAll('.seg').forEach(g=>g.onclick=e=>{const b=e.target.closest('button');if(!b)return;const i=$(g.dataset.for);i.value=b.dataset.v;i.dispatchEvent(new Event('input'))});
const PRE={manuscript:{font:'Times New Roman',size:16,lh:'2',ps:0,ind:1.5,mg:72,al:'left'},novel:{font:'Lora',size:17,lh:'1.5',ps:0,ind:1.5,mg:64,al:'justify'},airy:{font:'Crimson Pro',size:20,lh:'1.7',ps:10,ind:0,mg:56,al:'left'}};
document.querySelectorAll('[data-pre]').forEach(b=>b.onclick=()=>{B().fmt={...DEF,...PRE[b.dataset.pre]};applyFmt();save('m_'+cur)});
for(const[i,d]of[['sm',-1],['sp',1]])$(i).onclick=()=>{const z=$('size');z.value=Math.min(28,Math.max(12,+z.value+d));z.dispatchEvent(new Event('input'))};
$('nb').onclick=()=>$('np').classList.toggle('open');$('nc').onclick=()=>$('np').classList.remove('open');
$('foc').onclick=()=>{document.body.classList.add('focus');$('np').classList.remove('open');setView('w')};$('unfoc').onclick=()=>document.body.classList.remove('focus');
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;closePops();$('hm').hidden=true;$('np').classList.remove('open');document.body.classList.remove('focus')});
$('list').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('ch')){e.preventDefault();e.target.click()}});
/* ---------- story map ---------- */
let Z=1;
const nw=n=>Math.max(96,n.t.length*7.5+28);
const BG={Character:'#ffd9a8',Scene:'#d4cffa',Place:'#bfeacb',Idea:'#ffc6d4'};
function bpt(n,tx,ty){const w=nw(n)/2,cx=n.x+w,cy=n.y+18,dx=tx-cx,dy=ty-cy,k=Math.max(Math.abs(dx)/w,Math.abs(dy)/18,1e-6);return[cx+dx/k,cy+dy/k]}
function drawMap(){const m=B().map,ns=Object.fromEntries(m.n.map(n=>[n.id,n]));
 let h='<defs><marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1l9 4-9 4z" fill="#8a8794"/></marker></defs>';
 m.e.forEach((e,i)=>{const a=ns[e.a],b=ns[e.b];if(!a||!b)return;
  const ax=a.x+nw(a)/2,ay=a.y+18,bx=b.x+nw(b)/2,by=b.y+18,qx=(ax+bx)/2-(by-ay)*.14,qy=(ay+by)/2+(bx-ax)*.14;
  const[x1,y1]=bpt(a,qx,qy),[x2,y2]=bpt(b,qx,qy),d=`M${x1} ${y1}Q${qx} ${qy} ${x2} ${y2}`,s=sel&&sel.e===i,lx=.25*x1+.5*qx+.25*x2,ly=.25*y1+.5*qy+.25*y2;
  h+=`<g data-e="${i}" style="cursor:pointer"><path d="${d}" class="eg ${s?'sel':''}" marker-end="url(#ar)"/><path d="${d}" fill="none" stroke="transparent" stroke-width="26"/>`;
  if(e.l)h+=`<rect class="chip" x="${lx-e.l.length*3.2-7}" y="${ly-10}" width="${e.l.length*6.4+14}" height="20" rx="10"/><text class="el" x="${lx}" y="${ly+4}" text-anchor="middle">${esc(e.l)}</text>`;
  h+='</g>';
  if(s){const t=.3,u=.7,xx=u*u*x1+2*u*t*qx+t*t*x2,yy=u*u*y1+2*u*t*qy+t*t*y2;h+=`<g data-x="${i}" style="cursor:pointer"><circle cx="${xx}" cy="${yy}" r="12" fill="#e8567a"/><path d="M${xx-4} ${yy-4}l8 8M${xx+4} ${yy-4}l-8 8" stroke="#fff" stroke-width="2" stroke-linecap="round"/></g>`}});
 m.n.forEach(n=>{h+=`<g class="nd ${sel&&sel.n===n.id?'sel':''}" data-n="${n.id}"><rect x="${n.x}" y="${n.y}" width="${nw(n)}" height="36" rx="18" fill="${BG[n.k]||'#e5e5e5'}"/><text x="${n.x+nw(n)/2}" y="${n.y+22}" text-anchor="middle">${esc(n.t)}</text></g>`});
 const s=$('svg');s.innerHTML=h;s.style.width=1800*Z+'px';s.style.height=1100*Z+'px';panel()}
function panel(){const m=B().map,p=$('pan');let h=Object.keys(KC).map(k=>`<button class="btn sm" data-add="${k}">${ic('plus')}${k}</button>`).join('');
 if(sel&&sel.n){const n=m.n.find(x=>x.id===sel.n);if(!n){sel=null;return panel()}
  h+=`<span class="sep"></span><input id="pl" aria-label="Name" value="${esc(n.t)}"><select id="pk" aria-label="Type">${Object.keys(KC).map(k=>`<option ${k===n.k?'selected':''}>${k}</option>`).join('')}</select><button class="btn sm ${link?'on':''}" id="plk">${ic('link')}${link?'Tap another node…':'Connect'}</button><button class="btn sm" id="pd">${ic('trash')}Node</button>`
  +m.e.map((e,i)=>({e,i})).filter(({e})=>e.a===n.id||e.b===n.id).map(({e,i})=>{const o=m.n.find(x=>x.id===(e.a===n.id?e.b:e.a));return `<button class="btn sm" data-ue="${i}" title="Remove this link">${ic('link')}${esc(o?o.t:'?')}${e.l?' ('+esc(e.l)+')':''} ${ic('x')}</button>`}).join('')}
 else if(sel&&sel.e!=null&&m.e[sel.e]){h+=`<span class="sep"></span><input id="pl" aria-label="Relationship" placeholder="Relationship (e.g. loves, rival of)" value="${esc(m.e[sel.e].l||'')}"><button class="btn sm" id="pd">${ic('trash')}Remove link</button>`}
 else h+='<span class="hint">Add items, drag to arrange, tap one to connect.</span>';
 p.innerHTML=h}
$('zi').onclick=()=>{Z=Math.min(1.6,Z+.15);drawMap()};$('zo').onclick=()=>{Z=Math.max(.5,Z-.15);drawMap()};
$('pan').onclick=e=>{const t=e.target.closest('button');if(!t)return;const m=B().map;
 if(t.dataset.ue!=null){m.e.splice(+t.dataset.ue,1);save('g_'+cur);return drawMap()}
 if(t.dataset.add){const sc=$('cv'),id=uid();m.n.push({id,t:t.dataset.add,k:t.dataset.add,x:(sc.scrollLeft+40+Math.random()*200)/Z,y:(sc.scrollTop+40+Math.random()*160)/Z});sel={n:id};link=false;save('g_'+cur);drawMap();setTimeout(()=>{const i=$('pl');if(i){i.focus();i.select()}},0)}
 else if(t.id==='plk'){link=!link;panel()}
 else if(t.id==='pd'){if(sel.n){m.n=m.n.filter(x=>x.id!==sel.n);m.e=m.e.filter(x=>x.a!==sel.n&&x.b!==sel.n)}else m.e.splice(sel.e,1);sel=null;link=false;save('g_'+cur);drawMap()}}
$('pan').oninput=e=>{const m=B().map;if(e.target.id==='pl'){if(sel.n)m.n.find(x=>x.id===sel.n).t=e.target.value||' ';else m.e[sel.e].l=e.target.value;save('g_'+cur);const v=e.target.value;drawMap();const i=$('pl');i.focus();i.setSelectionRange(v.length,v.length)}
 if(e.target.id==='pk'){m.n.find(x=>x.id===sel.n).k=e.target.value;save('g_'+cur);drawMap()}}
$('svg').addEventListener('pointerdown',e=>{const g=e.target.closest('[data-n],[data-e]'),m=B().map,xx=e.target.closest('[data-x]');
 if(xx){m.e.splice(+xx.dataset.x,1);sel=null;save('g_'+cur);return drawMap()}
 if(!g){sel=null;link=false;return drawMap()}
 if(g.dataset.e!=null){sel={e:+g.dataset.e};link=false;return drawMap()}
 const id=g.dataset.n;
 if(link&&sel&&sel.n&&sel.n!==id){if(!m.e.some(x=>(x.a===sel.n&&x.b===id)||(x.a===id&&x.b===sel.n))){m.e.push({a:sel.n,b:id,l:''});sel={e:m.e.length-1}}link=false;save('g_'+cur);return drawMap()}
 sel={n:id};const n=m.n.find(x=>x.id===id),r=$('svg').getBoundingClientRect();drag={n,dx:(e.clientX-r.left)/Z-n.x,dy:(e.clientY-r.top)/Z-n.y,moved:false};drawMap()});
document.addEventListener('pointermove',e=>{if(!drag)return;const r=$('svg').getBoundingClientRect();drag.n.x=Math.max(0,(e.clientX-r.left)/Z-drag.dx);drag.n.y=Math.max(0,(e.clientY-r.top)/Z-drag.dy);drag.moved=true;drawMap()});
document.addEventListener('pointerup',()=>{if(drag&&drag.moved)save('g_'+cur);drag=null});
/* ---------- history ---------- */
function setDone(){$('dn').checked=!!C().done}
function snap(n,c,label,gap){const ch=S.bk[n]&&S.bk[n].ch[c];if(!ch||!ch.text)return;const k=n+'_'+c,h=S.hist[k]||(S.hist[k]=[]);
 if(h[0]&&h[0].text===ch.text)return;if(gap&&!h[0]&&ch.text.length<300)return;if(gap&&h[0]&&Date.now()-h[0].ts<gap)return;
 h.unshift({ts:Date.now(),title:ch.title,text:ch.text,label});let tot=0;for(let i=0;i<h.length;i++){tot+=h[i].text.length;if(tot>120000&&i>0){h.length=i;break}}
 if(h.length>40)h.length=40;save('h_'+k)}
function histRender(){const n=cur,h=S.hist[n+'_'+cc]||[];let o='<h4 style="margin:6px 0">This chapter</h4>';
 o+=h.length?h.map((v,i)=>`<div class="hr"><div style="display:flex;gap:8px;align-items:center"><span style="flex:1">${new Date(v.ts).toLocaleString()} · ${words(v.text)} words <span class="stat">${esc(v.label||'')}</span></span><button class="btn sm" data-p="1">View</button><button class="btn sm" data-r="${i}">Restore</button></div><pre>${esc(v.text.replace(/[\u0001\u0002]/g,''))}</pre></div>`).join(''):'<div class="stat">No versions yet. They are saved as you write, or tap “Save version now”.</div>';
 const dead=Object.keys(S.hist).filter(x=>x.startsWith(n+'_')&&!B().ch[x.slice(n.length+1)]&&S.hist[x].length);
 if(dead.length)o+='<h4 style="margin:14px 0 6px">Deleted chapters</h4>'+dead.map(x=>{const v=S.hist[x][0];return `<div class="hr" style="display:flex;gap:8px;align-items:center"><span style="flex:1">${esc(v.title||'Untitled')} · ${words(v.text)} words</span><button class="btn sm" data-d="${x}">Restore chapter</button></div>`}).join('');
 $('hl').innerHTML=o}
$('hb').onclick=()=>{$('hm').hidden=false;histRender()};$('hc').onclick=()=>{$('hm').hidden=true};
$('hm').onclick=e=>{if(e.target===$('hm'))$('hm').hidden=true};
$('hs').onclick=()=>{const h=S.hist[cur+'_'+cc],t=C().text;snap(cur,cc,'Saved by you',0);histRender();if(!t)setStat('Nothing written yet');else if(h&&h[0]&&h[0].text===t)setStat('Already saved')};
$('hl').onclick=e=>{const p=e.target.closest('[data-p]');if(p)return p.closest('.hr').classList.toggle('open');
 const r=e.target.closest('[data-r]');if(r){const v=S.hist[cur+'_'+cc][+r.dataset.r];snap(cur,cc,'Before restore',0);C().text=v.text;save('c_'+cur+'_'+cc);openCh(cc);histRender();return setStat('Version restored')}
 const d=e.target.closest('[data-d]');if(d){const k=d.dataset.d,cid=k.slice(cur.length+1),v=S.hist[k][0];B().ch[cid]={title:v.title,text:v.text,notes:'',done:false};B().order.push(cid);save('m_'+cur);save('c_'+cur+'_'+cid);openCh(cid);histRender()}};
document.addEventListener('keydown',e=>{if(view!=='m'||!sel||/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName))return;if(e.key==='Delete'||e.key==='Backspace'){const d=$('pd');if(d)d.click()}});
/* ---------- PDF export (pages drawn with your real fonts) ---------- */
$('pdf').onclick=async()=>{const b=B(),fin=b.order.filter(id=>b.ch[id].done),ids=fin.length?fin:b.order;if(!window.jspdf)return setStat('PDF tool failed to load');
 const f=b.fmt,PW=794,PH=1123,SC=1.6,M=f.mg,fs=f.size,lead=fs*(+f.lh),tw=PW-2*M,ind=f.ind*fs,gap=+f.ps,fam=`"${f.font}",Georgia,serif`;
 const t=S.lib.find(n=>n.id===cur).title||'Novel';setStat('Loading fonts…');
 try{await Promise.all(['','bold ','italic ','italic bold '].map(p=>document.fonts.load(`${p}${fs}px "${f.font}"`,'Aa')))}catch(e){}
 const cv=document.createElement('canvas');cv.width=PW*SC;cv.height=PH*SC;const x=cv.getContext('2d'),doc=new jspdf.jsPDF({unit:'pt',format:'a4',compress:true});
 let pages=0,pn=0,inv=[],y=0;
 const fnt=(s,z)=>{x.font=`${/italic/.test(s)?'italic ':''}${/bold/.test(s)?'bold ':''}${z||fs}px ${fam}`};
 const fresh=()=>{x.setTransform(SC,0,0,SC,0,0);x.fillStyle='#fff';x.fillRect(0,0,PW,PH);x.fillStyle='#111';x.textBaseline='alphabetic';inv=[]};
 const out=num=>{if(num){fnt('normal',13);x.textAlign='center';x.fillText(String(num),PW/2,PH-M/2+4)}
  if(pages)doc.addPage();pages++;doc.addImage(cv.toDataURL('image/jpeg',.72),'JPEG',0,0,595.28,841.89,undefined,'FAST');
  try{doc.setFont('times','normal');doc.setFontSize(fs*.75);inv.forEach(q=>doc.text(q[0],q[1]*.75,q[2]*.75,{renderingMode:'invisible'}))}catch(e){}};
 const sty=(b,i)=>b&&i?'bolditalic':b?'bold':i?'italic':'normal';
 const toks=p=>{let bo=0,it=0,o=[],cur='',cs='normal';const fl=sp=>{if(cur){fnt(cs);o.push({t:cur,s:cs,sp:!!sp,kw:x.measureText(cur).width});cur=''}else if(sp&&o.length)o[o.length-1].sp=true};
  for(const ch of p){if(ch==='\u0001'||ch==='\u0002'){fl();ch==='\u0001'?bo^=1:it^=1;continue}if(ch===' '){fl(1);continue}if(!cur)cs=sty(bo,it);cur+=ch}fl();return o};
 fresh();fnt('bold',46);x.textAlign='center';x.fillText(t,PW/2,PH/3,tw);fnt('normal',16);x.fillText(ids.length+' chapter'+(ids.length>1?'s':''),PW/2,PH/3+50);out(0);
 for(let ci=0;ci<ids.length;ci++){const c=b.ch[ids[ci]];setStat(`Building PDF… chapter ${ci+1}/${ids.length}`);await new Promise(r=>setTimeout(r));
  fresh();y=M+34;fnt('bold',fs*1.6);x.textAlign='center';x.fillText(c.title||'Untitled',PW/2,y,tw);y+=lead*2.2;
  for(const p of (c.text||'').split('\n')){fnt('normal');const sp=x.measureText(' ').width,lines=[];let ln=[],w=0,lim=tw-ind;
   toks(p).forEach(k=>{if(ln.length&&w+k.kw>lim){lines.push(ln);ln=[];w=0;lim=tw}ln.push(k);w+=k.kw+(k.sp?sp:0)});if(ln.length)lines.push(ln);
   lines.forEach((l,i)=>{if(y>PH-M){out(++pn);fresh();y=M+fs}const first=i===0,lt=first?tw-ind:tw,last=i===lines.length-1;
    const gaps=l.slice(0,-1).filter(k=>k.sp).length,nat=l.reduce((a,k,j)=>a+k.kw+(k.sp&&j<l.length-1?sp:0),0);
    const extra=(f.al==='justify'&&!last&&gaps)?(lt-nat)/gaps:0;let xx=f.al==='center'?M+(tw-nat)/2:M+(first?ind:0);
    l.forEach((k,j)=>{fnt(k.s);x.textAlign='left';x.fillText(k.t,xx,y);xx+=k.kw+(k.sp&&j<l.length-1?sp+extra:0)});
    inv.push([l.map(k=>k.t).join(' '),M+(first?ind:0),y]);y+=lead});y+=gap}
  out(++pn)}
 try{doc.save(t.replace(/[^\w\- ]+/g,'')+'.pdf');setStat(fin.length?'Exported finished chapters':'No chapter marked finished — exported all')}catch(e){setStat('Export cancelled')}};
/* ---------- sync ---------- */
const norm=o=>{const c={...o};delete c.ts;return JSON.stringify(c)};
const nwords=n=>Object.values(S.bk[n].ch).reduce((a,c)=>a+words(c.text),0);
function merge(docs,first){const ids=new Set(docs.map(d=>d.id)),act=document.activeElement;let legacy=false,ch=false,keep=[];
 const eb=n=>S.bk[n]||(ch=true,S.bk[n]=mk());
 for(const d of docs){const x=d.data();if(!x)continue;const id=d.id;
  if(id!=='settings'&&!id.startsWith('ch_')){const l=docData(id);if(l&&norm(l)===norm(x))continue}
  if(id[0]!=='h')ch=true;
  if(id==='lib'){keep=first?S.lib.filter(n=>!x.lib.some(y=>y.id===n.id)&&S.bk[n.id]&&nwords(n.id)>0):[];S.lib=[...x.lib,...keep];x.lib.forEach(n=>eb(n.id))}
  else if(id[0]==='m'&&id[1]==='_'){const b=eb(id.slice(2));b.fmt={...DEF,...x.fmt};b.order=x.order||[]}
  else if(id[0]==='g'&&id[1]==='_')eb(id.slice(2)).map={n:x.n||[],e:x.e||[]};
  else if(id[0]==='h'&&id[1]==='_'){const[,n,c]=id.split('_');S.hist[n+'_'+c]=x.v||[]}
  else if(id[0]==='c'&&id[1]==='_'){const[,n,c]=id.split('_');if(!(n===cur&&c===cc&&act&&(act.id==='ed'||act.id==='nt'||act.id==='ct')))eb(n).ch[c]={title:x.title,text:x.text,notes:x.notes||'',done:!!x.done}}
  else if(id==='settings'&&!ids.has('m_main')){legacy=true;if(!S.lib.some(y=>y.id==='main'))S.lib.push({id:'main',title:x.title||'My Novel'});const b=eb('main');b.fmt={...DEF,...x.fmt};b.order=x.order||[]}
  else if(id.startsWith('ch_')&&!ids.has('c_main_'+id.slice(3))){legacy=true;eb('main').ch[id.slice(3)]={title:x.title,text:x.text,notes:'',done:false}}}
 if(!ch)return;
 if(ids.has('lib'))for(const n in S.bk)if(!S.lib.some(y=>y.id===n))delete S.bk[n];
 for(const n in S.bk)S.bk[n].order=S.bk[n].order.filter(c=>S.bk[n].ch[c]);
 S.lib=S.lib.filter(n=>S.bk[n.id]);
 if(!S.lib.length){addBook('My Novel')}if(!S.bk[cur])cur=S.lib[0].id;
 if(legacy||keep.length)saveAll();
 if(act&&(act.id==='ed'||act.id==='nt'||act.id==='ct'||act.id==='pl'||drag))return renderList();
 openBook(cur,true)}
async function boot(){await loadLocal();if(!S.lib.length){cur=addBook('My Novel');addCh()}if(!S.bk[cur])cur=S.lib[0].id;
 try{document.execCommand('defaultParagraphSeparator',false,'div')}catch(e){}openBook(cur);setStat('Saved on this device')}
const ready=boot();
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));
const KEY='ns-key';
async function api(method,qs,body){let k=localStorage.getItem(KEY);
 for(;;){if(!k){k=prompt('Enter your Novel Studio passphrase');if(!k)throw 0}
  const r=await fetch('/api/sync'+(qs||''),{method,headers:{'x-key':k,'content-type':'application/json'},body:body?JSON.stringify(body):undefined});
  if(r.status===401){localStorage.removeItem(KEY);k=null;continue}
  if(!r.ok)throw new Error(r.status);localStorage.setItem(KEY,k);return r.json()}}
base='';
db={doc:p=>{const id=p.split('/').pop();return{set:d=>api('PUT','',{id,data:d}),delete:()=>api('DELETE','?id='+encodeURIComponent(id))}}};
let first=true;
async function pull(){try{const o=await api('GET');const docs=Object.entries(o).map(([id,data])=>({id,data:()=>data}));
 if(first&&!docs.length)saveAll();else if(docs.length){if(first&&!docs.some(x=>x.id==='lib'||x.id==='settings'))saveAll();merge(docs,first)}
 first=false;if(!pend.size)setStat('Synced ✓')}catch(e){setStat('Saved on this device')}}
setStat('Connecting…');ready.then(pull);
setInterval(()=>{if(!document.hidden&&!pend.size)pull()},20000);
addEventListener('focus',()=>{if(!pend.size)pull()});
