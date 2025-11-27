class Dashboard {
    constructor() {
        this.user = null;
        this.currentPage = 'overview';
        this.updates = [];
    }

    async init() {
        try {
            const response = await fetch('/api/auth/me', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                this.user = data.user || data;
                this.setupUI();
                this.loadPage('overview');
            } else {
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Failed to load user:', error);
            window.location.href = '/login';
        }
    }

    setupUI() {
        const userDisplay = document.getElementById('userDisplay');
        if (userDisplay) {
            userDisplay.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px;">
                    <img id="headerAvatar" src="${this.user?.avatar_url || '/static/cdn/avatar.png'}" alt="Avatar" style="width: 32px; height: 32px; border-radius: 8px;">
                    <div>
                        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 2px;">${this.user?.role || 'member'}@${this.user?.username}.glowi.es</p>
                        <h3 style="font-size: 16px; margin: 0; color: var(--text-primary);">${this.user?.display_name || this.user?.username}</h3>
                    </div>
                </div>
            `;
        }

        this.setupSidebar();
        this.setupSearchBar();
        this.setupModalStyles();
    }

    setupSidebar() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await fetch('/api/auth/logout', { 
                    method: 'POST',
                    credentials: 'include' 
                });
                window.location.href = '/login';
            });
        }
        
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    this.loadPage(page);
                    document.querySelectorAll('.nav-item[data-page]').forEach(i => i.classList.remove('active'));
                    item.classList.add('active');
                }
            });
        });
    }

    setupSearchBar() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        let searchTimeout;
        let cachedResults = {};

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const resultsContainer = document.getElementById('searchResults');

            if (!resultsContainer) return;

            clearTimeout(searchTimeout);

            if (query.length === 0) {
                resultsContainer.style.display = 'none';
                return;
            }

            if (cachedResults[query]) {
                this.displaySearchResults(cachedResults[query], resultsContainer);
                return;
            }

            searchTimeout = setTimeout(async () => {
                try {
                    const [linksRes, filesRes, connectionsRes] = await Promise.all([
                        fetch('/api/links', { credentials: 'include' }),
                        fetch('/api/files', { credentials: 'include' }),
                        fetch('/api/connections', { credentials: 'include' })
                    ]);

                    let results = [];

                    if (linksRes.ok) {
                        const data = await linksRes.json();
                        results.push(...(data.links || []).filter(l => 
                            l.title?.toLowerCase().includes(query) || 
                            l.url?.toLowerCase().includes(query)
                        ).map(l => ({ type: 'link', item: l })));
                    }

                    if (filesRes.ok) {
                        const data = await filesRes.json();
                        results.push(...(data.files || []).filter(f => 
                            f.filename?.toLowerCase().includes(query)
                        ).map(f => ({ type: 'file', item: f })));
                    }

                    if (connectionsRes.ok) {
                        const data = await connectionsRes.json();
                        results.push(...(data.connections || []).filter(c => 
                            c.platform?.toLowerCase().includes(query)
                        ).map(c => ({ type: 'connection', item: c })));
                    }

                    cachedResults[query] = results;
                    this.displaySearchResults(results, resultsContainer);
                } catch (error) {
                    console.error('Search failed:', error);
                }
            }, 300);
        });
    }

    displaySearchResults(results, container) {
        if (results.length === 0) {
            container.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted);">No results found</div>';
            container.style.display = 'block';
            return;
        }

        const html = results.slice(0, 5).map(r => {
            if (r.type === 'link') {
                return `<div class="search-result-item" onclick="dashboard.loadPage('biolinks')"><strong>${r.item.title}</strong><p>${r.item.url}</p></div>`;
            } else if (r.type === 'file') {
                return `<div class="search-result-item"><strong>${r.item.filename}</strong><p>${dashboard.formatFileSize(r.item.size)}</p></div>`;
            } else {
                return `<div class="search-result-item"><strong>${r.item.platform}</strong><p>Connected account</p></div>`;
            }
        }).join('');

        container.innerHTML = html;
        container.style.display = 'block';
    }

    updateUserDisplay() {
        this.setupUI();
    }

    async loadPage(page) {
        this.currentPage = page;
        const contentArea = document.getElementById('contentArea');
        if (!contentArea) return;

        try {
            contentArea.style.opacity = '0';
            contentArea.style.transition = 'opacity 0.3s ease';
            
            setTimeout(async () => {
                switch(page) {
                    case 'overview':
                        await this.renderOverview();
                        break;
                    case 'biolinks':
                        await this.renderBiolinks();
                        break;
                    case 'images':
                    case 'files':
                        await this.renderFiles();
                        break;
                    case 'profile':
                        await this.renderProfile();
                        break;
                    case 'security':
                        await this.renderSecurity();
                        break;
                    case 'connections':
                        await this.renderConnections();
                        break;
                    case 'settings':
                        await this.renderSettings();
                        break;
                    case 'privacy':
                        await this.renderPrivacy();
                        break;
                    case 'litterbox':
                        await this.renderLitterBox();
                        break;
                    case 'tos':
                        await this.renderToS();
                        break;
                    case 'api':
                        await this.renderAPI();
                        break;
                    default:
                        await this.renderOverview();
                }
                
                contentArea.style.opacity = '1';
            }, 150);
        } catch (error) {
            console.error('Error loading page:', error);
            contentArea.innerHTML = `<div class="empty-state"><h3>Error loading page</h3><p>${error.message}</p></div>`;
        }
    }

    async renderOverview() {
        const profile = await this.fetchProfile();
        const links = await this.fetchLinks();
        const files = await this.fetchFiles();
        
        let stats = { uid: this.user?.id || 0, storage_used: 0, storage_limit: 1073741824, license_status: 'Inactive' };
        try {
            const statsRes = await fetch('/api/profile/stats', { credentials: 'include' });
            if (statsRes.ok) {
                stats = await statsRes.json();
            }
        } catch (e) {}

        let updates = [];
        try {
            const updatesRes = await fetch('/api/updates', { credentials: 'include' });
            if (updatesRes.ok) {
                const data = await updatesRes.json();
                updates = data.updates || [];
                this.updates = updates;
            }
        } catch (e) {}
        
        const storagePercent = Math.min((stats.storage_used / stats.storage_limit) * 100, 100).toFixed(1);

        const formatUpdateDate = (dateStr) => {
            const date = new Date(dateStr);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        };
        
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-header">
                <div>
                    <h1 class="page-title">Dashboard</h1>
                    <p class="page-subtitle">Welcome back, @${this.user?.display_name || this.user?.username}</p>
                </div>
            </div>
            
            <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 24px;">
                <div class="stat-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
                    <div class="stat-icon" style="width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3 style="font-size: 24px; margin-bottom: 4px;">UID ${stats.uid}</h3>
                        <p style="color: var(--text-muted); font-size: 13px;">User ID</p>
                    </div>
                </div>
                <div class="stat-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
                    <div class="stat-icon" style="width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3 style="font-size: 24px; margin-bottom: 4px;">${stats.profile_views || 0}</h3>
                        <p style="color: var(--text-muted); font-size: 13px;">Profile Views</p>
                    </div>
                </div>
                <div class="stat-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
                    <div class="stat-icon" style="width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3 style="font-size: 24px; margin-bottom: 4px;">${this.formatFileSize(stats.storage_used)} / ${this.formatFileSize(stats.storage_limit)}</h3>
                        <p style="color: var(--text-muted); font-size: 13px;">Storage Used</p>
                    </div>
                </div>
                <div class="stat-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
                    <div class="stat-icon" style="width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: var(--bg-tertiary);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                            <path d="M2 17l10 5 10-5"></path>
                            <path d="M2 12l10 5 10-5"></path>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3 style="font-size: 24px; margin-bottom: 4px;">${stats.license_status}</h3>
                        <p style="color: var(--text-muted); font-size: 13px;">License Status</p>
                    </div>
                </div>
            </div>
            
            <div class="updates-section" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="card-icon">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                            </div>
                            <div>
                                <h3 class="card-title">Latest Updates</h3>
                                <p class="card-description">Recent platform changes and announcements</p>
                            </div>
                        </div>
                    </div>
                    <div class="updates-list" id="updatesList" style="max-height: 300px; overflow-y: auto;">
                        ${updates.length > 0 ? updates.map((update, idx) => `
                            <div class="update-item" style="padding: 16px; border-bottom: 1px solid var(--border-color); cursor: pointer;" 
                                onclick="dashboard.openUpdateModal(${idx})">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                    <div>
                                        <h4 style="font-size: 14px; margin-bottom: 4px; color: var(--text-primary);">${update.title}</h4>
                                        <p style="font-size: 13px; color: var(--text-muted); line-height: 1.4;">${update.description || ''}</p>
                                    </div>
                                    <span style="font-size: 12px; color: var(--text-muted); white-space: nowrap; margin-left: 16px;">${formatUpdateDate(update.created_at)}</span>
                                </div>
                            </div>
                        `).join('') : `
                            <div style="padding: 24px; text-align: center; color: var(--text-muted);">
                                <p>No updates yet</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
        
    }

    async renderProfile() {
        const profile = await this.fetchProfile();
        
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Profile</h1>
                    <p class="page-subtitle">Manage your public profile information</p>
                </div>
            </div>
            
            <div class="cards-grid">
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="8" r="4"></circle>
                                <path d="M4 21v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Profile Information</h3>
                            <p class="card-description">Update your public profile</p>
                        </div>
                    </div>
                    
                    <div class="form-group" style="display: flex; align-items: center; gap: 20px; margin-bottom: 24px;">
                        <div class="avatar-upload">
                            <img src="${profile?.avatar_url || '/static/cdn/avatar.png'}" alt="Avatar" id="profileAvatar">
                            <button class="avatar-upload-btn" id="changeAvatarBtn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                            </button>
                            <input type="file" id="avatarInput" accept="image/*" style="display: none;">
                        </div>
                        <div>
                            <h4 style="margin-bottom: 4px;">Profile Picture</h4>
                            <p style="color: var(--text-muted); font-size: 13px;">PNG, JPG, GIF up to 5MB</p>
                        </div>
                    </div>
                    
                    <form id="profileForm">
                        <div class="form-group">
                            <label class="form-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                    <circle cx="12" cy="8" r="4"></circle>
                                    <path d="M4 21v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1"></path>
                                </svg>
                                Display Name
                            </label>
                            <input type="text" class="form-input" id="displayName" value="${this.user?.display_name || ''}" placeholder="Your display name">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                Username
                            </label>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <input type="text" class="form-input" id="usernameInput" value="${this.user?.username || ''}" placeholder="your_username" style="flex: 1;">
                                <button type="button" class="btn btn-secondary" id="changeUsernameBtn" style="white-space: nowrap;">Change Username</button>
                            </div>
                            <p style="color: var(--text-muted); font-size: 12px; margin-top: 6px;">Letters, numbers, and underscores only. 1-20 characters.</p>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                    <line x1="17" y1="10" x2="3" y2="10"></line>
                                    <line x1="21" y1="6" x2="3" y2="6"></line>
                                    <line x1="21" y1="14" x2="3" y2="14"></line>
                                    <line x1="17" y1="18" x2="3" y2="18"></line>
                                </svg>
                                Bio
                            </label>
                            <textarea class="form-input" id="profileBio" placeholder="Tell visitors about yourself">${profile?.bio || ''}</textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </form>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M15 7h3a5 5 0 0 1 0 10h-3"></path>
                                <path d="M9 17H6a5 5 0 0 1 0-10h3"></path>
                                <path d="M8 12h8"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Your Bio Link</h3>
                            <p class="card-description">Share your profile</p>
                        </div>
                    </div>
                    
                    <div style="background: var(--bg-tertiary); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
                        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">Your profile URL</p>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <code style="flex: 1; font-size: 14px; color: var(--accent-secondary);">${window.location.origin}/@${this.user?.username}</code>
                            <button class="btn btn-secondary" style="padding: 8px 12px;" onclick="navigator.clipboard.writeText('${window.location.origin}/@${this.user?.username}'); dashboard.showToast('Link copied!', 'success');">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <a href="/@${this.user?.username}" target="_blank" class="btn btn-secondary" style="width: 100%;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        View Profile
                    </a>
                </div>
            </div>
        `;

        this.setupProfileForm();
        this.setupAvatarUpload();
        this.setupUsernameChange();
    }

    setupUsernameChange() {
        const btn = document.getElementById('changeUsernameBtn');
        const input = document.getElementById('usernameInput');
        if (!btn || !input) return;

        btn.addEventListener('click', async () => {
            const newUsername = input.value.trim();
            
            if (!newUsername || newUsername.length < 1 || newUsername.length > 20) {
                this.showToast('Username must be 1-20 characters', 'error');
                return;
            }

            if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
                this.showToast('Username can only contain letters, numbers, and underscores', 'error');
                return;
            }

            if (newUsername.toLowerCase() === this.user?.username?.toLowerCase()) {
                this.showToast('This is already your username', 'error');
                return;
            }

            try {
                const response = await fetch('/api/profile/username', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username: newUsername })
                });

                if (response.ok) {
                    const data = await response.json();
                    this.user.username = data.username;
                    this.updateUserDisplay();
                    this.showToast('Username changed successfully', 'success');
                } else {
                    const data = await response.json();
                    this.showToast(data.error || 'Failed to change username', 'error');
                }
            } catch (error) {
                this.showToast('Failed to change username', 'error');
            }
        });
    }

    setupProfileForm() {
        const form = document.getElementById('profileForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const displayName = document.getElementById('displayName').value;
            const bio = document.getElementById('profileBio').value;

            try {
                const response = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ display_name: displayName, bio })
                });

                if (response.ok) {
                    this.user.display_name = displayName;
                    this.updateUserDisplay();
                    this.showToast('Profile updated successfully', 'success');
                } else {
                    throw new Error('Failed to update profile');
                }
            } catch (error) {
                this.showToast('Failed to update profile', 'error');
            }
        });
    }

    setupAvatarUpload() {
        const btn = document.getElementById('changeAvatarBtn');
        const input = document.getElementById('avatarInput');
        
        if (!btn || !input) return;

        btn.addEventListener('click', () => input.click());
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('avatar', file);

            try {
                const response = await fetch('/api/profile/avatar', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('profileAvatar').src = data.avatar_url;
                    document.getElementById('userAvatar').src = data.avatar_url;
                    document.getElementById('headerAvatar').src = data.avatar_url;
                    this.showToast('Avatar updated', 'success');
                } else {
                    throw new Error('Upload failed');
                }
            } catch (error) {
                this.showToast('Failed to upload avatar', 'error');
            }
        });
    }

    async renderSecurity() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Security</h1>
                    <p class="page-subtitle">Manage your account security, privacy settings, and data protection</p>
                </div>
            </div>
            
            <div class="cards-grid">
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                <circle cx="12" cy="16" r="1"></circle>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Account Security</h3>
                            <p class="card-description">Protect your account with additional security measures</p>
                        </div>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                    <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                Two-Factor Authentication
                            </span>
                            <span class="item-value">Disabled</span>
                        </div>
                        <span class="item-action">Enable</span>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                    <rect x="2" y="3" width="20" height="14" rx="2"></rect>
                                    <path d="M8 21h8"></path>
                                    <path d="M12 17v4"></path>
                                </svg>
                                Active Sessions
                            </span>
                            <span class="item-value">1 active session</span>
                        </div>
                        <span class="item-action">Manage</span>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                                </svg>
                                Password
                            </span>
                            <span class="item-value">Last changed recently</span>
                        </div>
                        <span class="item-action" id="changePasswordBtn">Change</span>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Privacy Settings</h3>
                            <p class="card-description">Control your visibility and profile appearance</p>
                        </div>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                                Profile Visibility
                            </span>
                            <span class="item-value">Public</span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 6v6l4 2"></path>
                                </svg>
                                Profile Themes
                            </span>
                            <span class="item-value">Customize appearance</span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                    <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <path d="M21 15l-5-5L5 21"></path>
                                </svg>
                                Avatar & Banner
                            </span>
                            <span class="item-value">Manage images</span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>
            </div>
            
            <div class="cards-grid" style="grid-template-columns: repeat(3, 1fr); margin-top: 24px;">
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                <path d="M9 12l2 2 4-4"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Data Protection</h3>
                            <p class="card-description">Manage your data collection preferences</p>
                        </div>
                    </div>
                    <span class="badge success">Protected</span>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 8v4l3 3"></path>
                                <circle cx="12" cy="12" r="10"></circle>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Login History</h3>
                            <p class="card-description">View recent login attempts</p>
                        </div>
                    </div>
                    <span class="badge success">Up to date</span>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Account Recovery</h3>
                            <p class="card-description">Set up recovery methods</p>
                        </div>
                    </div>
                    <span class="badge warning">Setup Required</span>
                </div>
            </div>
            
            <div class="card" style="margin-top: 24px;">
                <div class="card-header">
                    <div class="card-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                            <line x1="12" y1="9" x2="12" y2="13"></line>
                            <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                    </div>
                    <div>
                        <h3 class="card-title">Danger Zone</h3>
                        <p class="card-description">Irreversible account actions</p>
                    </div>
                </div>
                
                <div class="card-item">
                    <div class="item-info">
                        <span class="item-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                            Delete Account
                        </span>
                        <span class="item-value">Permanently delete your account and all data</span>
                    </div>
                    <button class="btn btn-danger" style="padding: 8px 16px;">Delete Account</button>
                </div>
            </div>
        `;

        this.setupPasswordChange();
    }

    setupPasswordChange() {
        const btn = document.getElementById('changePasswordBtn');
        if (!btn) return;

        btn.addEventListener('click', () => {
            this.showModal('Change Password', `
                <form id="passwordForm">
                    <div class="form-group">
                        <label class="form-label">Current Password</label>
                        <input type="password" class="form-input" id="currentPassword" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">New Password</label>
                        <input type="password" class="form-input" id="newPassword" required minlength="8">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirm New Password</label>
                        <input type="password" class="form-input" id="confirmPassword" required>
                    </div>
                </form>
            `, async () => {
                const current = document.getElementById('currentPassword').value;
                const newPass = document.getElementById('newPassword').value;
                const confirm = document.getElementById('confirmPassword').value;

                if (newPass !== confirm) {
                    this.showToast('Passwords do not match', 'error');
                    return false;
                }

                try {
                    const response = await fetch('/api/auth/change-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ current_password: current, new_password: newPass })
                    });

                    if (response.ok) {
                        this.showToast('Password changed successfully', 'success');
                        return true;
                    } else {
                        const data = await response.json();
                        this.showToast(data.error || 'Failed to change password', 'error');
                        return false;
                    }
                } catch (error) {
                    this.showToast('Failed to change password', 'error');
                    return false;
                }
            });
        });
    }

    async renderSettings() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Settings</h1>
                    <p class="page-subtitle">General account settings</p>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </div>
                    <div>
                        <h3 class="card-title">Preferences</h3>
                        <p class="card-description">Customize your experience</p>
                    </div>
                </div>
                
                <div class="card-item">
                    <div class="item-info">
                        <span class="item-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </svg>
                            Dark Mode
                        </span>
                        <span class="item-value">Currently active</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" checked disabled>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                
                <div class="card-item">
                    <div class="item-info">
                        <span class="item-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            Email Notifications
                        </span>
                        <span class="item-value">Receive updates about your account</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                
                <div class="card-item">
                    <div class="item-info">
                        <span class="item-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                            </svg>
                            Analytics
                        </span>
                        <span class="item-value">Track profile visits</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" checked>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
        `;
    }

    async renderPrivacy() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Privacy</h1>
                    <p class="page-subtitle">Control your data and privacy settings</p>
                </div>
            </div>
            
            <div class="cards-grid">
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Profile Visibility</h3>
                            <p class="card-description">Control who can see your profile</p>
                        </div>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="2" y1="12" x2="22" y2="12"></line>
                                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                </svg>
                                Public Profile
                            </span>
                            <span class="item-value">Anyone can view your profile</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="M21 21l-4.35-4.35"></path>
                                </svg>
                                Show in Search
                            </span>
                            <span class="item-value">Allow search engines to index</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Data & Privacy</h3>
                            <p class="card-description">Manage your data</p>
                        </div>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Download Data
                            </span>
                            <span class="item-value">Get a copy of your data</span>
                        </div>
                        <button class="btn btn-secondary" style="padding: 8px 16px;">Download</button>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                                </svg>
                                Usage Analytics
                            </span>
                            <span class="item-value">Help improve our service</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
        `;
    }

    async renderBiolinks() {
        const links = await this.fetchLinks();
        const contentArea = document.getElementById('contentArea');
        
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Bio Links</h1>
                    <p class="page-subtitle">Manage your bio link collection</p>
                </div>
            </div>
            
            <div class="card" style="margin-bottom: 24px;">
                <div class="card-header">
                    <div class="card-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 7h3a5 5 0 0 1 0 10h-3"></path>
                            <path d="M9 17H6a5 5 0 0 1 0-10h3"></path>
                            <path d="M8 12h8"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="card-title">Add New Link</h3>
                        <p class="card-description">Create a new bio link</p>
                    </div>
                </div>
                
                <form id="addLinkForm" style="padding: 20px;">
                    <div class="form-group">
                        <label class="form-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                <line x1="17" y1="10" x2="3" y2="10"></line>
                                <line x1="21" y1="6" x2="3" y2="6"></line>
                                <line x1="21" y1="14" x2="3" y2="14"></line>
                                <line x1="17" y1="18" x2="3" y2="18"></line>
                            </svg>
                            Title
                        </label>
                        <input type="text" class="form-input" id="linkTitle" placeholder="Link title" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                <path d="M15 7h3a5 5 0 0 1 0 10h-3"></path>
                                <path d="M9 17H6a5 5 0 0 1 0-10h3"></path>
                                <path d="M8 12h8"></path>
                            </svg>
                            URL
                        </label>
                        <input type="url" class="form-input" id="linkUrl" placeholder="https://..." required>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Add Link</button>
                </form>
            </div>
            
            <div style="margin-top: 24px;">
                <h3 style="margin-bottom: 16px;">Your Links</h3>
                <div class="cards-grid" id="linksGrid" style="grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));">
                    ${links.length === 0 ? `
                        <div class="empty-state" style="grid-column: 1 / -1;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M15 7h3a5 5 0 0 1 0 10h-3"></path>
                                <path d="M9 17H6a5 5 0 0 1 0-10h3"></path>
                                <path d="M8 12h8"></path>
                            </svg>
                            <h3>No links added yet</h3>
                            <p>Create your first bio link above</p>
                        </div>
                    ` : links.map(link => `
                        <div class="card">
                            <div style="padding: 16px; border-bottom: 1px solid var(--border-color);">
                                <h4 style="margin-bottom: 4px; color: var(--text-primary);">${link.title}</h4>
                                <p style="font-size: 12px; color: var(--text-muted); word-break: break-all;">${link.url}</p>
                            </div>
                            <div style="padding: 12px; display: flex; gap: 8px;">
                                <button class="btn btn-secondary" style="flex: 1; padding: 8px; font-size: 12px;" onclick="dashboard.editLink(${link.id})">Edit</button>
                                <button class="btn btn-danger" style="flex: 1; padding: 8px; font-size: 12px;" onclick="dashboard.deleteLink(${link.id})">Delete</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const form = document.getElementById('addLinkForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addLink(
                document.getElementById('linkTitle').value,
                document.getElementById('linkUrl').value
            );
        });
    }

    async addLink(title, url) {
        try {
            const response = await fetch('/api/links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title, url })
            });

            if (response.ok) {
                this.showToast('Link added successfully', 'success');
                this.renderBiolinks();
            } else {
                throw new Error('Failed to add link');
            }
        } catch (error) {
            this.showToast('Failed to add link', 'error');
        }
    }

    async editLink(id) {
        const links = await this.fetchLinks();
        const link = links.find(l => l.id === id);
        if (!link) return;

        const title = prompt('Link title:', link.title);
        if (!title) return;

        const url = prompt('Link URL:', link.url);
        if (!url) return;

        try {
            const response = await fetch(`/api/links/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title, url })
            });

            if (response.ok) {
                this.showToast('Link updated', 'success');
                this.renderBiolinks();
            } else {
                throw new Error('Failed to update');
            }
        } catch (error) {
            this.showToast('Failed to update link', 'error');
        }
    }

    async deleteLink(id) {
        if (!confirm('Are you sure you want to delete this link?')) return;

        try {
            const response = await fetch(`/api/links/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.showToast('Link deleted', 'success');
                this.renderBiolinks();
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            this.showToast('Failed to delete link', 'error');
        }
    }

    async renderFiles() {
        const files = await this.fetchFiles();
        
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Images</h1>
                    <p class="page-subtitle">Secure file storage with E2EE encryption</p>
                </div>
            </div>
            
            <div class="upload-area" id="uploadArea">
                <input type="file" id="fileInput" style="display: none;" multiple>
                <div class="upload-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                </div>
                <h3 style="margin-bottom: 8px;">Select or drop files</h3>
                <p style="color: var(--text-muted); margin-bottom: 16px;">Files up to 200 MB. Encrypted end-to-end.</p>
                <button class="btn btn-primary">Choose Files</button>
            </div>
            
            <div class="card" style="margin-top: 32px; margin-bottom: 32px;">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <path d="M21 15l-5-5L5 21"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">About Images</h3>
                            <p class="card-description">Secure permanent file storage with E2EE encryption</p>
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="window.location.href='./faq'">View FAQ</button>
                </div>
                <div style="padding: 16px; color: var(--text-muted); line-height: 1.6;">
                    <p>Upload and store files permanently with full end-to-end encryption. Your files are encrypted before they leave your device, and we cannot access them. Perfect for long-term secure storage.</p>
                    <p style="margin-top: 12px;"><strong style="color: var(--text-primary);">Forbidden file types:</strong> .exe, .scr, .cpl, .doc*, .jar</p>
                </div>
            </div>
            
            <div style="margin-top: 32px;">
                <h3 style="margin-bottom: 16px;">Your Files</h3>
                <div class="cards-grid" style="grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));" id="filesGrid">
                    ${files.length === 0 ? `
                        <div class="empty-state" style="grid-column: 1 / -1;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                            <h3>No files uploaded</h3>
                            <p>Upload your first file to get started</p>
                        </div>
                    ` : files.map(file => `
                        <div class="file-card">
                            <div class="file-preview">
                                ${file.mime_type?.startsWith('image/') ? 
                                    `<img src="${file.url}" alt="${file.filename}">` :
                                    `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                        <polyline points="13 2 13 9 20 9"></polyline>
                                    </svg>`
                                }
                            </div>
                            <div class="file-info">
                                <h4>${file.filename}</h4>
                                <div class="file-meta">
                                    <span>${this.formatFileSize(file.size)}</span>
                                    ${file.expires_at ? `<span>Expires: ${new Date(file.expires_at).toLocaleDateString()}</span>` : ''}
                                    ${file.password_protected ? '<span>Protected</span>' : ''}
                                </div>
                            </div>
                            <div class="file-actions">
                                <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${window.location.origin}/file/${file.code}'); dashboard.showToast('Link copied!', 'success');">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                    Copy
                                </button>
                                <button class="btn btn-danger" onclick="dashboard.deleteFile('${file.code}')">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M3 6h18M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2l-1-14"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.setupFileUpload();
    }

    setupFileUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (!uploadArea || !fileInput) return;

        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            this.uploadFiles(files);
        });

        fileInput.addEventListener('change', (e) => {
            this.uploadFiles(e.target.files);
        });
    }

    async uploadFiles(files) {
        for (const file of files) {
            await this.uploadFile(file);
        }
        this.renderFiles();
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/files/upload', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (response.ok) {
                this.showToast(`${file.name} uploaded`, 'success');
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            this.showToast(`Failed to upload ${file.name}`, 'error');
        }
    }

    async deleteFile(code) {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            const response = await fetch(`/api/files/${code}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.showToast('File deleted', 'success');
                this.renderFiles();
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            this.showToast('Failed to delete file', 'error');
        }
    }

    async renderConnections() {
        const connections = await this.fetchConnections();
        
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Connections</h1>
                    <p class="page-subtitle">Connect your social media accounts</p>
                </div>
            </div>
            
            <div class="cards-grid">
                ${[
                    { platform: 'twitter', label: 'Twitter', icon: '<path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7"></path>' },
                    { platform: 'github', label: 'GitHub', icon: '<path d="M16 22v-5.5c0-.833.023-1.5-.75-2.75.75-.75 2.1-2.128 2.1-5.25 0-1.5-.75-2.25-1.5-3 .15-.75.7-2.325-.15-3 0 0-1.289-.15-4.25 1.3-1.848-.45-3.604-.45-5.452 0-2.961-1.45-4.25-1.3-4.25-1.3-.85.675-.3 2.25-.15 3-.75.75-1.5 1.5-1.5 3 0 3.122 1.35 4.5 2.1 5.25-.773 1.25-.75 1.917-.75 2.75V22"></path>' },
                    { platform: 'instagram', label: 'Instagram', icon: '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><circle cx="17.5" cy="6.5" r="1.5"></circle>' },
                    { platform: 'discord', label: 'Discord', icon: '<path d="M20.317 4.492c-1.53-.742-3.17-1.297-4.885-1.6a.058.058 0 00-.064.028c-.211.375-.444.864-.607 1.25-1.645-.246-3.281-.246-4.897 0-.163-.386-.397-.875-.61-1.25a.059.059 0 00-.064-.027c-1.723.303-3.341.858-4.887 1.6a.058.058 0 00-.033.052c-.331 4.942.278 9.789 1.238 14.565a.06.06 0 00.052.035c1.646.477 3.24.91 4.817 1.22a.059.059 0 00.066-.03c.23-.383.452-.829.626-1.275a.06.06 0 00-.033-.088c-.749-.227-1.456-.481-2.14-.76a.06.06 0 00-.028-.11c.142-.11.285-.228.422-.35a.059.059 0 00.064-.008c4.489 2.139 9.36 2.139 13.815 0a.059.059 0 00.064.008c.137.122.28.24.422.35a.06.06 0 00-.028.11c-.684.279-1.39.533-2.142.76a.06.06 0 00-.033.089c.175.446.397.892.627 1.275a.059.059 0 00.066.03c1.578-.31 3.172-.743 4.819-1.22a.06.06 0 00.052-.035c1.02-4.963 1.629-9.776 1.17-14.565a.059.059 0 00-.032-.052z"></path>' }
                ].map(plat => {
                    const conn = connections.find(c => c.platform === plat.platform);
                    return `
                        <div class="card">
                            <div class="card-header">
                                <div class="card-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        ${plat.icon}
                                    </svg>
                                </div>
                                <div>
                                    <h3 class="card-title">${plat.label}</h3>
                                    <p class="card-description">${conn ? 'Connected' : 'Not connected'}</p>
                                </div>
                            </div>
                            
                            ${conn ? `
                                <div style="padding: 16px;">
                                    <div style="background: var(--bg-tertiary); border-radius: 8px; padding: 12px; margin-bottom: 12px;">
                                        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 6px;">Username</p>
                                        <input type="text" id="${plat.platform}_username" class="form-input" value="${conn.username}" style="margin-bottom: 8px;">
                                        <button onclick="dashboard.updateConnection('${plat.platform}', '${conn.id}')" class="btn btn-primary" style="width: 100%; padding: 8px; font-size: 12px; margin-bottom: 8px;">Save Changes</button>
                                        <button onclick="dashboard.disconnectPlatform('${plat.platform}')" class="btn btn-danger" style="width: 100%; padding: 8px; font-size: 12px;">Disconnect</button>
                                    </div>
                                </div>
                            ` : `
                                <div style="padding: 16px;">
                                    <button class="btn btn-primary" style="width: 100%;" onclick="alert('Connect ${plat.label}')">Connect Account</button>
                                </div>
                            `}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    async updateConnection(platform, id) {
        const username = document.getElementById(`${platform}_username`).value.trim();
        
        if (!username) {
            this.showToast('Please enter a username', 'error');
            return false;
        }

        try {
            const response = await fetch(`/api/connections/${platform}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username })
            });

            if (response.ok) {
                this.showToast('Connection updated', 'success');
                this.renderConnections();
            } else {
                throw new Error('Failed to update');
            }
        } catch (error) {
            this.showToast('Failed to update connection', 'error');
            return false;
        }
    }

    async disconnectPlatform(platform) {
        if (!confirm(`Disconnect ${platform.replace('_', ' ')}?`)) return;

        try {
            const response = await fetch(`/api/connections/${platform}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.showToast('Disconnected', 'success');
                this.renderConnections();
            } else {
                throw new Error('Failed to disconnect');
            }
        } catch (error) {
            this.showToast('Failed to disconnect', 'error');
        }
    }

    async renderLitterBox() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">LitterBox</h1>
                    <p class="page-subtitle">Temporary encrypted file hosting - Files auto-delete after expiry</p>
                </div>
            </div>
            
            <div class="card" style="margin-bottom: 24px;">
                <div class="card-header">
                    <div class="card-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    </div>
                    <div>
                        <h3 class="card-title">Temporary File Upload</h3>
                        <p class="card-description">Files up to 1GB with automatic expiration</p>
                    </div>
                </div>
                
                <form id="litterboxForm" style="padding: 20px;">
                    <div class="upload-area" id="litterboxUploadArea" style="margin-bottom: 20px;">
                        <input type="file" id="litterboxFileInput" style="display: none;">
                        <div class="upload-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                        </div>
                        <h3 style="margin-bottom: 8px;">Select or drop file</h3>
                        <p style="color: var(--text-muted); margin-bottom: 16px;">Max 1GB. E2EE encrypted. Auto-deletes.</p>
                        <button type="button" class="btn btn-primary" onclick="document.getElementById('litterboxFileInput').click()">Choose File</button>
                    </div>
                    
                    <div id="selectedFileInfo" style="display: none; margin-bottom: 20px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" stroke-width="2">
                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                            <div>
                                <p id="selectedFileName" style="font-weight: 500;"></p>
                                <p id="selectedFileSize" style="font-size: 13px; color: var(--text-muted);"></p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Expiration Time
                        </label>
                        <select class="form-input" id="litterboxExpiry" style="cursor: pointer;">
                            <option value="1">1 Hour</option>
                            <option value="12">12 Hours</option>
                            <option value="24" selected>1 Day</option>
                            <option value="72">3 Days</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 6px;">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            Password Protection (Optional)
                        </label>
                        <input type="password" class="form-input" id="litterboxPassword" placeholder="Leave empty for no password">
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%;" id="litterboxSubmitBtn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        Upload Temporary File
                    </button>
                </form>
            </div>
            
            <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                <div class="card" style="flex: 1; padding: 20px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 600; color: var(--accent-primary);">1 GB</div>
                    <p style="color: var(--text-muted);">Max File Size</p>
                </div>
                <div class="card" style="flex: 1; padding: 20px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 600; color: var(--accent-secondary);">3 Days</div>
                    <p style="color: var(--text-muted);">Max Duration</p>
                </div>
                <div class="card" style="flex: 1; padding: 20px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 600; color: var(--accent-primary);">E2EE</div>
                    <p style="color: var(--text-muted);">Encrypted</p>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">About LitterBox</h3>
                            <p class="card-description">Temporary file hosting for sensitive files</p>
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="window.location.href='./lbfaq'">View FAQ</button>
                </div>
                <div style="padding: 16px; color: var(--text-muted); line-height: 1.6;">
                    <p>LitterBox provides temporary, encrypted file hosting. Files are automatically deleted after the chosen expiration time. Perfect for sharing sensitive files that don't need to exist forever.</p>
                    <p style="margin-top: 12px;"><strong style="color: var(--text-primary);">Forbidden file types:</strong> .exe, .scr, .cpl, .doc*, .jar</p>
                </div>
            </div>
        `;

        this.setupLitterBoxUpload();
    }

    setupLitterBoxUpload() {
        const uploadArea = document.getElementById('litterboxUploadArea');
        const fileInput = document.getElementById('litterboxFileInput');
        const form = document.getElementById('litterboxForm');
        const submitBtn = document.getElementById('litterboxSubmitBtn');
        
        if (!uploadArea || !fileInput) return;

        let selectedFile = null;

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                selectedFile = e.dataTransfer.files[0];
                this.showSelectedFile(selectedFile);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                this.showSelectedFile(selectedFile);
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedFile) {
                this.showToast('Please select a file first', 'error');
                return;
            }

            const forbidden = ['.exe', '.scr', '.cpl', '.jar'];
            const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
            if (forbidden.includes(ext) || ext.startsWith('.doc')) {
                this.showToast('This file type is not allowed', 'error');
                return;
            }

            if (selectedFile.size > 1024 * 1024 * 1024) {
                this.showToast('File size exceeds 1GB limit', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('expiry_hours', document.getElementById('litterboxExpiry').value);
            const password = document.getElementById('litterboxPassword').value;
            if (password) formData.append('password', password);

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Uploading...';
                const response = await fetch('/api/files/upload-litterbox', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    this.showToast('File uploaded! Link: ' + window.location.origin + '/file/' + data.code, 'success');
                    form.reset();
                    selectedFile = null;
                    document.getElementById('selectedFileInfo').style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Upload Temporary File';
                } else {
                    throw new Error('Upload failed');
                }
            } catch (error) {
                this.showToast('Failed to upload file', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Upload Temporary File';
            }
        });
    }

    showSelectedFile(file) {
        document.getElementById('selectedFileName').textContent = file.name;
        document.getElementById('selectedFileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('selectedFileInfo').style.display = 'block';
    }

    async renderToS() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Terms of Service</h1>
                    <p class="page-subtitle">Please read these terms carefully</p>
                </div>
            </div>
            
            <div class="card">
                <div style="padding: 20px;">
                    <p style="color: var(--text-muted); margin-bottom: 16px;"><em>Last updated: November 27, 2025</em></p>
                    <h3 style="margin-bottom: 12px;">1. Use License</h3>
                    <p style="color: var(--text-muted); margin-bottom: 16px;">Unless otherwise stated, we own the intellectual property rights for all material on glowi.es. All intellectual property rights are reserved. You may access this website for personal use subject to restrictions set in these terms and conditions.</p>
                    <h3 style="margin-bottom: 12px;">2. User Responsibilities</h3>
                    <p style="color: var(--text-muted); margin-bottom: 16px;">You must not modify any portion of the website. You must not reproduce, duplicate, copy, sell, resell or exploit any portion of the service without express written permission by us.</p>
                    <h3 style="margin-bottom: 12px;">3. File Hosting</h3>
                    <p style="color: var(--text-muted); margin-bottom: 16px;">All files stored on our platform are encrypted end-to-end. We are not responsible for content uploaded by users. Users agree not to upload any content that violates copyright, trademark, or other intellectual property rights.</p>
                    <h3 style="margin-bottom: 12px;">4. Disclaimer</h3>
                    <p style="color: var(--text-muted); margin-bottom: 16px;">The information on this website is provided "as is" without any representations or warranties, express or implied. We make no representations or warranties in relation to this website or the information and materials provided.</p>
                    <h3 style="margin-bottom: 12px;">5. Limitations of Liability</h3>
                    <p style="color: var(--text-muted);">In no event shall glowi.es or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on this website.</p>
                </div>
            </div>
        `;
    }

    async renderAPI() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">API Documentation</h1>
                    <p class="page-subtitle">Integrate with glowi.es</p>
                </div>
            </div>
            
            <div class="card">
                <div style="padding: 20px;">
                    <h3 style="margin-bottom: 12px;">API Endpoints</h3>
                    <p style="color: var(--text-muted); margin-bottom: 16px;">Coming soon. API documentation and integration guides will be available here.</p>
                </div>
            </div>
        `;
    }

    openUpdateModal(index) {
        if (!this.updates || !this.updates[index]) return;
        
        const update = this.updates[index];
        this.showModal(update.title, `
            <div>
                <p style="color: var(--text-muted); margin-bottom: 12px;">${update.description || ''}</p>
                <p style="color: var(--text-muted); line-height: 1.6;">${update.details || ''}</p>
            </div>
        `);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : 'var(--bg-secondary)'};
            color: white;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showModal(title, content, callback) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            backdrop-filter: blur(4px);
            animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="background: var(--bg-secondary); border-radius: 12px; padding: 24px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h2 style="margin: 0; font-size: 20px;">${title}</h2>
                    <button class="modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-muted);">&times;</button>
                </div>
                <div style="margin-bottom: 24px;">${content}</div>
                ${callback ? `
                    <div style="display: flex; gap: 12px;">
                        <button class="btn btn-secondary" style="flex: 1;" onclick="this.closest('[style*=fixed]').remove()">Cancel</button>
                        <button class="btn btn-primary" style="flex: 1;" onclick="if(${callback.toString()}()) { this.closest('[style*=fixed]').remove(); }">Confirm</button>
                    </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(modal);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        if (!document.querySelector('style[data-modal-animation]')) {
            style.setAttribute('data-modal-animation', '');
            document.head.appendChild(style);
        }

        const close = () => {
            modal.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('.modal-close').addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    async fetchProfile() {
        try {
            const response = await fetch('/api/profile', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                return data.profile || {};
            }
            return {};
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            return {};
        }
    }

    async fetchLinks() {
        try {
            const response = await fetch('/api/links', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                return data.links || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch links:', error);
            return [];
        }
    }

    async fetchFiles() {
        try {
            const response = await fetch('/api/files', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                return data.files || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch files:', error);
            return [];
        }
    }

    async fetchConnections() {
        try {
            const response = await fetch('/api/connections', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                return data.connections || [];
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch connections:', error);
            return [];
        }
    }
}

const dashboard = new Dashboard();
dashboard.init();
