// Files component JS: handles listing, upload (demo using object URL), preview and delete
const API_BASE = '/api/images';

async function fetchFiles(){
  try{
    const res = await fetch(API_BASE, {credentials:'include'});
    if(!res.ok) throw new Error('Failed to fetch files');
    const data = await res.json();
    return data.images || [];
  }catch(e){console.warn(e);return []}
}

function renderFiles(list, container){
  container.innerHTML = '';
  if(!list.length){ container.innerHTML = '<div class="card-content">No files found.</div>'; return }
  for(const f of list){
    const tile = document.createElement('div'); tile.className='file-tile';
    const thumb = document.createElement('img'); thumb.className='file-thumb';
    thumb.src = f.url || '../assets/user-placeholder.png'; thumb.alt = f.filename || 'file';
    const meta = document.createElement('div'); meta.className='file-meta';
    const name = document.createElement('div'); name.className='file-name'; name.textContent = f.filename || 'untitled';
    const actions = document.createElement('div'); actions.className='file-actions';
    const view = document.createElement('button'); view.className='btn'; view.textContent='Preview';
    view.addEventListener('click', ()=>openPreview(f));
    const del = document.createElement('button'); del.className='btn btn-secondary'; del.textContent='Delete';
    del.addEventListener('click', ()=>deleteFile(f.id, tile));
    actions.appendChild(view); actions.appendChild(del);
    meta.appendChild(name); meta.appendChild(actions);
    tile.appendChild(thumb); tile.appendChild(meta);
    container.appendChild(tile);
  }
}

function openPreview(file){
  const modalRoot = document.getElementById('cb-modal-root');
  modalRoot.style.display = 'block';
  modalRoot.innerHTML = `<div class="cb-modal" role="dialog" aria-modal="true"><div class="cb-modal-panel"><div style="text-align:right"><button id="cb-modal-close" class="btn btn-secondary">Close</button></div><img src="${file.url}" style="max-width:100%;border-radius:8px;display:block;margin:8px 0" alt="${file.filename}"></div></div>`;
  document.getElementById('cb-modal-close').addEventListener('click', ()=>{ modalRoot.style.display='none'; modalRoot.innerHTML=''; });
}

async function deleteFile(id, tileEl){
  if(!confirm('Delete this file?')) return;
  try{
    const res = await fetch(`${API_BASE}/${id}`, {method:'DELETE',credentials:'include'});
    if(!res.ok) throw new Error('Delete failed');
    tileEl.remove();
  }catch(e){alert('Delete failed');console.error(e)}
}

async function tryMultipartUpload(file, onProgress){
  // Try multipart upload to server endpoint '/api/images/upload-file'
  try{
    if(!(window && window.FormData)) throw new Error('FormData not available');
    const form = new FormData();
    form.append('file', file, file.name);

    // Use fetch; browsers don't provide upload progress for fetch, so use XHR when onProgress provided
    if(typeof onProgress === 'function'){
      return await new Promise((resolve,reject)=>{
        const xhr = new XMLHttpRequest();
        xhr.open('POST', API_BASE + '/upload-file');
        xhr.withCredentials = true;
        xhr.upload.onprogress = function(e){ if(e.lengthComputable) onProgress(Math.round((e.loaded/e.total)*100)); };
        xhr.onload = function(){
          if(xhr.status>=200 && xhr.status<300){ try{ const json = JSON.parse(xhr.responseText); resolve(json.image||json); }catch(err){ resolve(null) } }
          else reject(new Error('Multipart upload failed: '+xhr.status));
        };
        xhr.onerror = function(){ reject(new Error('Multipart upload error')); };
        xhr.send(form);
      });
    }else{
      const res = await fetch(API_BASE + '/upload-file', { method: 'POST', body: form, credentials: 'include' });
      if(!res.ok) throw new Error('Multipart upload failed');
      const json = await res.json();
      return json.image || null;
    }
  }catch(err){ throw err }
}

function uploadFiles(files, onProgress){
  // Attempt multipart upload first; if server doesn't accept, fall back to metadata-only POST
  return Promise.all(Array.from(files).map(file=>{
    return new Promise(async (resolve,reject)=>{
      try{
        // Try multipart endpoint
        try{
          const img = await tryMultipartUpload(file, onProgress);
          resolve(img);
          return;
        }catch(multipartErr){
          console.warn('Multipart upload failed, falling back to metadata POST', multipartErr);
        }

        // Fallback: create object URL and POST metadata to /upload
        const objUrl = URL.createObjectURL(file);
        const body = { filename: file.name, url: objUrl, size: file.size, mime_type: file.type };
        const res = await fetch(API_BASE + '/upload', {method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify(body)});
        if(!res.ok) throw new Error('Upload metadata failed');
        const json = await res.json();
        resolve(json.image || null);
      }catch(err){reject(err)}
    })
  }))
}

export function initFiles(){
  const input = document.getElementById('cb-file-input');
  const drop = document.getElementById('cb-dropzone');
  const uploadBtn = document.getElementById('cb-upload-btn');
  const list = document.getElementById('cb-files-list');
  if(!list) return;

  // load existing
  fetchFiles().then(items=>renderFiles(items, list));

  // dropzone click to open input
  drop.addEventListener('click', ()=>input.click());
  drop.addEventListener('dragover', (e)=>{e.preventDefault(); drop.style.opacity='0.9'});
  drop.addEventListener('dragleave', ()=>{drop.style.opacity='1'});
  drop.addEventListener('drop', (e)=>{e.preventDefault(); drop.style.opacity='1'; if(e.dataTransfer.files.length) input.files = e.dataTransfer.files;});

  uploadBtn.addEventListener('click', async ()=>{
    if(!input.files || input.files.length===0){ alert('Select files first'); return }
    uploadBtn.disabled = true; uploadBtn.textContent = 'Uploading...';
    try{
      const uploaded = await uploadFiles(input.files);
      // refresh list
      const items = await fetchFiles(); renderFiles(items, list);
    }catch(err){console.error(err); alert('Upload failed')}
    uploadBtn.disabled = false; uploadBtn.textContent = 'Upload'; input.value='';
  });
}

// auto-init when view is loaded
if(typeof window !== 'undefined'){
  window.addEventListener('cb:view:loaded', (e)=>{ if(e.detail&&e.detail.view==='files'){ try{ initFiles() }catch(err){console.warn('files init error',err)} } });
}
