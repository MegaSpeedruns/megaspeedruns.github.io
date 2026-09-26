(() => {
  const style=document.createElement('style');style.textContent=`
  #browse-cloud-packs{position:absolute;bottom:7%;font-size:12px;}
  .hide-creator-assignment .creator-assignment,.hide-creator-assignment .admin-pack-delete{display:none;}
  .pack-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,200px),1fr));gap:16px;}
  .pack-grid .cloud-pack{word-break:break-word;box-sizing:border-box;}
  .pack-grid .pack-card{display:flex;flex-direction:column;margin-top:0;padding:12px;width:100%;}
  .pack-name{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;line-height:1.8;height:5.4em;flex-shrink:0;}
  .pack-creator{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;height:3.2em;flex-shrink:0;}
  .pack-grid .pack-thumbnail{flex-shrink:0;height:auto;}
  .pack-thumbnail{display:block;width:100%;aspect-ratio:8/7;object-fit:cover;background:#000;margin-bottom:12px;image-rendering:pixelated;}
  .cloud-dialog{position:fixed;inset:0;z-index:100;background:#000c;display:flex;align-items:center;justify-content:center;}
  .cloud-box{position:relative;width:min(600px,92vw);max-height:85vh;overflow:auto;padding:38px 24px 24px;border:4px solid #a4e4fc;background:#071328;color:#fff;font-size:12px;line-height:1.8;}
  .cloud-box button{font:inherit;cursor:pointer;}.cloud-close{position:absolute;right:8px;top:6px;background:none;border:0;color:#fff;font-size:24px!important;}
  .cloud-pack{display:block;width:100%;margin-top:12px;padding:12px;background:#183060;border:2px solid #468;color:#fff;text-align:left;}
  .cloud-box a{color:#a4e4fc;overflow-wrap:anywhere;} .cloud-box input{width:100%;margin:12px 0;padding:10px;}
  body.pack-locked #browse-cloud-packs,body.pack-locked #ps-load-pack,body.pack-locked #ps-default-pack{display:none!important;}
  `;document.head.append(style);
  const login=document.createElement('a');login.href='Login.html';login.textContent='Must be logged in to create pack';login.hidden=true;login.style.cssText='position:absolute;bottom:2%;color:#a4e4fc;font-size:10px;';document.querySelector('.title-inner').append(login);
  window.showCreateLoginMessage=()=>{login.hidden=false;};
  if(window.returnToPackChoices)pressStart();
  document.addEventListener('keydown',e=>{
    if(!e.shiftKey||e.key.toLowerCase()!=='e'||e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.isComposing)return;
    if(e.target.closest('input,textarea,select,[contenteditable]'))return;
    const dialogs=document.querySelectorAll('.cloud-dialog');if(!dialogs.length)return;
    e.preventDefault();e.stopImmediatePropagation();
    const box=dialogs[dialogs.length-1].querySelector('.cloud-box');
    if(box?.dataset.creatorAdmin==='true')box.classList.toggle('hide-creator-assignment');
  },true);
  let busy=false;
  function dialog(title,closable=true){const overlay=document.createElement('div');overlay.className='cloud-dialog';const box=document.createElement('div');box.className='cloud-box';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');const heading=document.createElement('h2');heading.textContent=title;heading.style.fontSize='14px';box.append(heading);overlay.append(box);document.body.append(overlay);if(closable){const close=document.createElement('button');close.className='cloud-close';close.textContent='×';close.setAttribute('aria-label','Close');close.onclick=()=>overlay.remove();box.append(close);}return {overlay,box};}
  function status(box,text){let p=box.querySelector('.cloud-status');if(!p){p=document.createElement('p');p.className='cloud-status';p.setAttribute('role','status');box.append(p);}p.textContent=text;}
  function friendly(error){if(/permission|unauthorized/i.test(error.code||error.message))return 'Firebase access is not enabled yet. Apply the Level Pack Creator rules.';return error.message||'Unable to connect to Firebase. Please try again.';}
  function valid(pack){
    if(!pack||!Array.isArray(pack.levels)||pack.levels.length>100)throw Error('Invalid pack.');
    const assets=[pack.wily2Icon,pack.wily2Background,pack.packThumbnail,pack.customBorderDefault,pack.customBorderActive,pack.titleBackground,pack.selectBackground,pack.wilyBackground,pack.victoryBackground,pack.wilyIcon,...Object.values(pack.music||{}),...pack.levels.flatMap(l=>[l.image,l.localLevelUrl])];
    if(assets.some(v=>v&&(typeof v!=='string'||/["'<>\r\n]/.test(v)||(!/^(https:\/\/|data:(image|audio)\/|images\/|music\/|sounds\/|border\/)/.test(v)))))throw Error('Pack contains an unsupported asset path.');
    return pack;
  }
  function install(pack){
    valid(pack);
    playPackMusicEnabled=true;
    CONFIG=Object.assign({},DEFAULTS,window.LEVEL_PACK||{},pack);
    CONFIG.music=Object.assign({},DEFAULTS.music,pack.music||{});
    CONFIG.levels=structuredClone(pack.levels);
    CONFIG.levelCount=Number(pack.levelCount??8);CONFIG.wilyStageCount=Number(pack.wilyStageCount??4);
    ensureLevelSlots();ensureSpecialStages();
    CONFIG.weapons=Array.from({length:12},(_,i)=>Object.assign({icon:i+1,levels:[],defaultWeapon:i===0},pack.weapons?.[i]));
    CONFIG.tankLevels=pack.tankLevels||{};
    state={beaten:{},weapons:{},tanks:{e:0,m:0},border:null,names:null,music:null,musicVolume:10,sounds:null};
    editMode=false;dirty=false;musicFadedForPlay=false;
    document.body.classList.remove('dirty');
    if(pack.cloudSlug&&location.protocol!=='file:'){
      history.replaceState(null,'',new URL('packcreator.html?pack='+encodeURIComponent(pack.cloudSlug),document.baseURI));
      window.directPack=pack.cloudSlug;document.body.classList.add('pack-locked');
    }
    document.querySelectorAll('.cloud-dialog').forEach(el=>el.remove());
    document.getElementById('pack-modal').classList.remove('open');
    document.getElementById('game-choice').hidden=true;document.getElementById('btn-start').hidden=false;
    showScreen('screen-title');applyConfig();
  }
  window.browseCloudPacks=async()=>{
    if(window.directPack)return;
    playPackMusicEnabled=false;musicRequest++;bgm.pause();bgm.removeAttribute('src');
    const {box,overlay}=dialog('PLAY PACK');
    box.style.width='min(960px,92vw)';status(box,'Loading packs…');const grid=document.createElement('div');grid.className='pack-grid';box.append(grid);
    box.classList.add('hide-creator-assignment');
    try{box.dataset.creatorAdmin=String((await PackCloud.permissions()).admin);}catch{}

    try{const packs=await PackCloud.list();status(box,packs.length?'Choose a pack.':'No packs published yet.');for(const pack of packs){const button=document.createElement('button');button.className='cloud-pack pack-card';const name=document.createElement('span');name.className='pack-name';name.textContent=pack.name;name.title=pack.name;button.append(name);const thumbnail=document.createElement('img');thumbnail.className='pack-thumbnail';thumbnail.alt='';button.prepend(thumbnail);PackCloud.load(pack.slug).then(data=>{valid(data);const paths=[data.packThumbnail,data.titleBackground].filter(Boolean).flatMap(p=>/^(data:|https:)/.test(p)||/\.[a-z0-9]+$/i.test(p)?[p]:[p+'.png',p+'.jpg',p+'.gif',p+'.webp']);let i=0;thumbnail.onerror=()=>{if(i<paths.length)thumbnail.src=paths[i++];else thumbnail.removeAttribute('src');};if(paths.length)thumbnail.src=paths[i++];}).catch(()=>{});button.onclick=async()=>{sfx();button.disabled=true;status(box,'Loading pack…');try{install(await PackCloud.load(pack.slug));}catch(e){button.disabled=false;status(box,friendly(e));}};const row=document.createElement('div');row.style.position='relative';row.append(button);const creator=document.createElement('div');creator.className='pack-creator';creator.style.cssText='font-size:10px;line-height:1.6;margin-top:8px;overflow-wrap:anywhere;color:#a4e4fc;';creator.textContent=pack.owner?'Creator: …':'Creator: Unassigned';button.append(creator);if(pack.owner)PackCloud.creatorName(pack.owner).then(name=>{creator.textContent='Creator: '+name;}).catch(()=>{creator.textContent='Creator: Unknown';});
      const access=await PackCloud.permissions(pack.slug);
      if(access.edit||access.admin){
        const remove=document.createElement('button');remove.textContent='×';if(!access.edit)remove.classList.add('admin-pack-delete');remove.setAttribute('aria-label','Delete '+pack.name);remove.style.cssText='position:absolute;right:8px;top:8px;background:none;border:0;color:white;font-size:24px;cursor:pointer;';
        remove.onclick=()=>{
          const confirmation=dialog('Are you sure you want to delete '+pack.name+'?');
          const yes=document.createElement('button');yes.className='cloud-pack';yes.textContent='DELETE PACK';
          const cancel=document.createElement('button');cancel.className='cloud-pack';cancel.textContent='CANCEL';cancel.onclick=()=>confirmation.overlay.remove();
          yes.onclick=async()=>{yes.disabled=true;remove.disabled=true;button.disabled=true;try{await PackCloud.remove(pack.slug);row.remove();confirmation.overlay.remove();status(box,box.querySelector('.cloud-pack')?'Choose a pack.':'No packs published yet.');}catch(e){yes.disabled=false;remove.disabled=false;button.disabled=false;status(confirmation.box,friendly(e));}};
          confirmation.box.append(yes,cancel);
        };row.append(remove);
      }
      if(access.admin){const assign=document.createElement('button');assign.className='cloud-pack creator-assignment';assign.textContent='ASSIGN CREATOR';assign.onclick=async()=>{const d=dialog('ASSIGN CREATOR');try{const select=document.createElement('select');select.style.maxWidth='100%';for(const person of await PackCloud.users()){const option=document.createElement('option');option.value=person.uid;option.textContent=person.name;option.selected=person.uid===pack.owner;select.append(option);}const apply=document.createElement('button');apply.className='cloud-pack';apply.textContent='SAVE CREATOR';apply.onclick=async()=>{try{await PackCloud.assign(pack.slug,select.value);d.overlay.remove();}catch(e){status(d.box,friendly(e));}};d.box.append(select,apply);}catch(e){status(d.box,friendly(e));}};row.append(assign);}
      grid.append(row);}}
    catch(e){status(box,friendly(e));}
  };

  window.saveCloudPack=async()=>{
    if(busy||(window.directPack&&!editMode))return;
    let name=CONFIG.cloudName;if(!name){name=prompt('Pack name for publishing:',CONFIG.packName||'');if(!name?.trim())return;name=name.trim();}
    busy=true;const {box,overlay}=dialog('SAVE PACK',false);status(box,'Connecting…');
    try{
      const pack=JSON.parse(serializePack().replace(/^window\.LEVEL_PACK\s*=\s*/,'').replace(/;\s*$/,''));
      const saved=await PackCloud.publish(pack,name,text=>status(box,text));
      // Keep local edits in memory; subsequent saves reuse uploaded URLs from the snapshot.
      Object.assign(CONFIG,saved);
      dirty=false;document.body.classList.remove('dirty');status(box,'Pack saved. Share this link:');
      const link=document.createElement('a');link.href=new URL('packcreator.html?pack='+encodeURIComponent(saved.cloudSlug),document.baseURI).href;link.textContent=link.href;box.append(link);
    }catch(e){status(box,'Error saving pack');}
    finally{busy=false;const close=document.createElement('button');close.className='cloud-pack';close.textContent='CLOSE';close.onclick=()=>overlay.remove();box.append(close);}
  };
  if(window.directPack){
    document.body.classList.add('pack-locked');
    const {box,overlay}=dialog('LOADING PACK',false);
    if(!/^[a-z0-9][a-z0-9-]{0,69}$/.test(window.directPack)){status(box,'Pack not found.');return;}
    PackCloud.load(window.directPack).then(pack=>{
      valid(pack);
      if(CONFIG.cloudSlug!==pack.cloudSlug||CONFIG.cloudRevision!==pack.cloudRevision)install(pack);
      else overlay.remove();
    }).catch(e=>status(box,friendly(e)));
  }
})();
