
export function initProfile() {

  if (window.__cb_profile_inited) return;
  window.__cb_profile_inited = true;

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile', { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.profile || null;
    } catch (err) {
      console.error('Failed to fetch profile', err);
      return null;
    }
  }

  function $(sel, root = document) { return root.querySelector(sel); }

  async function presignAndUpload(file, onProgress, maxRetries = 2) {
    let attempt = 0;
    let lastErr = null;
    while (attempt <= maxRetries) {
      try {

        const metaRes = await fetch('/api/images/presign', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, contentType: file.type })
        });
        if (!metaRes.ok) throw new Error('Failed to get presigned url');
        const meta = await metaRes.json();

        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', meta.signedUrl, true);
          xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && typeof onProgress === 'function') {
              onProgress(Math.round((e.loaded / e.total) * 100));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error('Upload failed: ' + xhr.status));
          };
          xhr.onerror = () => reject(new Error('Upload network error'));
          xhr.send(file);
        });

        const registerRes = await fetch('/api/images/upload', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, url: meta.publicUrl, size: file.size, mime_type: file.type })
        });
        if (!registerRes.ok) throw new Error('Failed to register uploaded file');
        const registerData = await registerRes.json();
        return registerData.image;
      } catch (err) {
        lastErr = err;
        attempt += 1;
        if (attempt > maxRetries) break;

        await new Promise((r) => setTimeout(r, 250 * attempt));
      }
    }
    throw lastErr || new Error('Upload failed');
  }

  async function init() {
    const root = document.getElementById('cb-main');
    if (!root) return;
    const form = document.getElementById('cb-profile-form');
    if (!form) return;

    const avatarImg = $('#cb-avatar-img', form);
    const avatarInput = $('#cb-avatar-input', form);
    const saveBtn = $('#cb-profile-save', form);
    const statusEl = $('#cb-profile-status', form);
    const progressEl = $('#cb-avatar-progress', form);

    const profile = await fetchProfile();
    if (profile) {
      $('#cb-displayName', form).value = profile.display_name || '';
      $('#cb-bio', form).value = profile.bio || '';
      $('#cb-social-twitter', form).value = (profile.socials && profile.socials.twitter) || '';
      if (profile.avatar_url) avatarImg.src = profile.avatar_url;
    }

    avatarInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      statusEl.textContent = '';
      if (progressEl) {
        progressEl.style.display = 'block';
        progressEl.value = 0;
        progressEl.setAttribute('aria-hidden', 'false');
      }
      try {
        const img = await presignAndUpload(file, (p) => {
          if (progressEl) progressEl.value = p;
          statusEl.textContent = `Uploading avatar: ${p}%`;
        }, 2);
        if (img && img.url) avatarImg.src = img.url;
        statusEl.textContent = 'Avatar uploaded';
      } catch (err) {
        console.error(err);
        statusEl.textContent = 'Avatar upload failed';
      } finally {
        setTimeout(()=>{ statusEl.textContent = ''; }, 2500);
        if (progressEl) {
          progressEl.style.display = 'none';
          progressEl.setAttribute('aria-hidden', 'true');
        }
      }
    });

    saveBtn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      saveBtn.disabled = true;
      statusEl.textContent = 'Saving profile...';
      const body = {
        display_name: $('#cb-displayName', form).value.trim(),
        bio: $('#cb-bio', form).value.trim(),
        socials: { twitter: $('#cb-social-twitter', form).value.trim() }
      };

      try {
        const res = await fetch('/api/profile', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Save failed');
        statusEl.textContent = 'Profile saved';
      } catch (err) {
        console.error(err);
        statusEl.textContent = 'Failed to save profile';
      } finally {
        saveBtn.disabled = false;
        setTimeout(()=>{ statusEl.textContent = ''; }, 2000);
      }
    });
  }

  window.addEventListener('cb:view:loaded', (e) => {
    if (e.detail && e.detail.view === 'profile') init();
  });

  setTimeout(()=>{
    const evt = new CustomEvent('cb:profile:tryinit');
    window.dispatchEvent(evt);
  }, 200);
}

export default initProfile;
