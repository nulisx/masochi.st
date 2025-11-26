class Dashboard {
    constructor() {
        this.currentPage = 'overview';
        this.user = null;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupNavigation();
        this.setupLogout();
        this.setupKeyboardShortcuts();
        this.showAdminSection();
        this.loadPage('overview');
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('.search-input');
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }

    showAdminSection() {
        if (!this.user) return;
        const adminRoles = ['owner', 'admin', 'manager', 'mod'];
        if (adminRoles.includes(this.user.role)) {
            const adminSection = document.getElementById('adminSection');
            if (adminSection) {
                adminSection.style.display = 'block';
            }
        }
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                window.location.href = '/login';
                return;
            }
            
            const data = await response.json();
            this.user = data.user;
            this.updateUserDisplay();
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/login';
        }
    }

    updateUserDisplay() {
        if (!this.user) return;
        
        document.getElementById('userName').textContent = this.user.display_name || this.user.username;
        document.getElementById('userHandle').textContent = '@' + this.user.username;
        document.getElementById('headerUserName').textContent = this.user.display_name || this.user.username;
    }

    setupNavigation() {
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.loadPage(page);
            });
        });

        window.addEventListener('hashchange', () => {
            const page = window.location.hash.slice(1) || 'overview';
            if (page !== this.currentPage) {
                this.loadPage(page);
            }
        });
    }

    setupLogout() {
        document.getElementById('logoutBtn').addEventListener('click', async () => {
            try {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                window.location.href = '/login';
            } catch (error) {
                console.error('Logout failed:', error);
            }
        });
    }

    setActivePage(page) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });
    }

    async loadPage(page) {
        this.currentPage = page;
        this.setActivePage(page);
        window.location.hash = page;
        
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = '<div class="loading-container"><div class="spinner"></div><p>Loading...</p></div>';

        try {
            switch (page) {
                case 'overview':
                    await this.renderOverview();
                    break;
                case 'profile':
                    await this.renderProfile();
                    break;
                case 'security':
                    await this.renderSecurity();
                    break;
                case 'biolinks':
                    await this.renderBiolinks();
                    break;
                case 'files':
                    await this.renderFiles();
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
                case 'admin-users':
                    await this.renderAdminUsers();
                    break;
                case 'admin-invites':
                    await this.renderAdminInvites();
                    break;
                case 'admin-files':
                    await this.renderAdminFiles();
                    break;
                case 'admin-analytics':
                    await this.renderAdminAnalytics();
                    break;
                default:
                    await this.renderOverview();
            }
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
                    <p class="page-subtitle">Welcome back, ${this.user?.display_name || this.user?.username}</p>
                </div>
            </div>
            
            <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
                <div class="stat-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
                    <div class="stat-icon" style="background: var(--accent-primary); width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3 style="font-size: 24px; margin-bottom: 4px;">UID ${stats.uid}</h3>
                        <p style="color: var(--text-muted); font-size: 13px;">User ID</p>
                    </div>
                </div>
                <div class="stat-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
                    <div class="stat-icon" style="background: #3b82f6; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                            <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3 style="font-size: 24px; margin-bottom: 4px;">${stats.storage_used} / ${this.formatFileSize(stats.storage_limit)}</h3>
                        <p style="color: var(--text-muted); font-size: 13px;">Storage Used</p>
                    </div>
                </div>
                <div class="stat-card" style="display: flex; align-items: center; gap: 16px; padding: 20px;">
                    <div class="stat-icon" style="background: ${stats.license_status === 'Active' ? 'var(--success)' : '#64748b'}; width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
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
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                    <div class="updates-list" style="max-height: 300px; overflow-y: auto;">
                        ${updates.length > 0 ? updates.map(update => `
                            <div class="update-item" style="padding: 16px; border-bottom: 1px solid var(--border-color); cursor: pointer;" onclick="dashboard.showUpdateDetails(${update.id}, '${update.title.replace(/'/g, "\\'")}', '${(update.description || '').replace(/'/g, "\\'")}', '${(update.details || '').replace(/'/g, "\\'")}', '${update.created_at}')">
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
            
            <div class="cards-grid">
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Account Security</h3>
                            <p class="card-description">Protect your account</p>
                        </div>
                    </div>
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Two-Factor Authentication</span>
                            <span class="item-value">Disabled</span>
                        </div>
                        <span class="item-action" onclick="dashboard.loadPage('security')">Enable</span>
                    </div>
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Active Sessions</span>
                            <span class="item-value">1 active</span>
                        </div>
                        <span class="item-action" onclick="dashboard.loadPage('security')">Manage</span>
                    </div>
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Password</span>
                            <span class="item-value">Last changed recently</span>
                        </div>
                        <span class="item-action" onclick="dashboard.loadPage('security')">Change</span>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon success">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Privacy Settings</h3>
                            <p class="card-description">Control your visibility</p>
                        </div>
                    </div>
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Profile Visibility</span>
                            <span class="item-value">Public</span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Profile Themes</span>
                            <span class="item-value">Customize appearance</span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Avatar & Banner</span>
                            <span class="item-value">Manage images</span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>
            </div>
            
            <div class="cards-grid" style="grid-template-columns: repeat(3, 1fr);">
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Data Protection</h3>
                            <p class="card-description">Manage your data collection preferences and download your information.</p>
                        </div>
                    </div>
                    <span class="badge success">Protected</span>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon success">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Login History</h3>
                            <p class="card-description">View recent login attempts and manage suspicious activity.</p>
                        </div>
                    </div>
                    <span class="badge success">Up to date</span>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon warning">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Account Recovery</h3>
                            <p class="card-description">Set up recovery methods and backup codes for account access.</p>
                        </div>
                    </div>
                    <span class="badge warning">Setup Required</span>
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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
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
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                            <label class="form-label">Display Name</label>
                            <input type="text" class="form-input" id="displayName" value="${this.user?.display_name || ''}" placeholder="Your display name">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Username</label>
                            <input type="text" class="form-input" value="@${this.user?.username || ''}" disabled style="opacity: 0.6;">
                            <p style="color: var(--text-muted); font-size: 12px; margin-top: 6px;">Username cannot be changed</p>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Bio</label>
                            <textarea class="form-input" id="profileBio" placeholder="Tell visitors about yourself">${profile?.bio || ''}</textarea>
                        </div>
                        
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </form>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon success">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
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
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Account Security</h3>
                            <p class="card-description">Protect your account with additional security measures</p>
                        </div>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Two-Factor Authentication</span>
                            <span class="item-value">Disabled</span>
                        </div>
                        <span class="item-action">Enable</span>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Active Sessions</span>
                            <span class="item-value">1 active session</span>
                        </div>
                        <span class="item-action">Manage</span>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Password</span>
                            <span class="item-value">Last changed recently</span>
                        </div>
                        <span class="item-action" id="changePasswordBtn">Change</span>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon success">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Privacy Settings</h3>
                            <p class="card-description">Control your visibility and profile appearance</p>
                        </div>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Profile Visibility</span>
                            <span class="item-value">Public</span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Profile Themes</span>
                            <span class="item-value">Customize appearance</span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Avatar & Banner</span>
                            <span class="item-value">Manage images</span>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>
            </div>
            
            <div class="cards-grid" style="grid-template-columns: repeat(3, 1fr); margin-top: 24px;">
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Data Protection</h3>
                            <p class="card-description">Manage your data collection preferences and download your information.</p>
                        </div>
                    </div>
                    <span class="badge success">Protected</span>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon success">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Login History</h3>
                            <p class="card-description">View recent login attempts and manage suspicious activity.</p>
                        </div>
                    </div>
                    <span class="badge success">Up to date</span>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <div class="card-icon warning">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Account Recovery</h3>
                            <p class="card-description">Set up recovery methods and backup codes for account access.</p>
                        </div>
                    </div>
                    <span class="badge warning">Setup Required</span>
                </div>
            </div>
            
            <div class="card" style="margin-top: 24px;">
                <div class="card-header">
                    <div class="card-icon danger">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="card-title">Danger Zone</h3>
                        <p class="card-description">Irreversible account actions</p>
                    </div>
                </div>
                
                <div class="card-item">
                    <div class="item-info">
                        <span class="item-label">Delete Account</span>
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
                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;

                if (newPassword !== confirmPassword) {
                    this.showToast('Passwords do not match', 'error');
                    return false;
                }

                try {
                    const response = await fetch('/api/profile/password', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ currentPassword, newPassword })
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

    async renderBiolinks() {
        const links = await this.fetchLinks();
        
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Biolinks</h1>
                    <p class="page-subtitle">Manage your bio links</p>
                </div>
                <button class="btn btn-primary" style="margin-left: auto;" id="addLinkBtn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Link
                </button>
            </div>
            
            <div class="links-list" id="linksList">
                ${links.length === 0 ? `
                    <div class="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        <h3>No links yet</h3>
                        <p>Add your first link to get started</p>
                        <button class="btn btn-primary" onclick="document.getElementById('addLinkBtn').click()">Add Your First Link</button>
                    </div>
                ` : links.map(link => `
                    <div class="link-item" data-id="${link.id}">
                        <div class="link-drag">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="8" y1="6" x2="21" y2="6"></line>
                                <line x1="8" y1="12" x2="21" y2="12"></line>
                                <line x1="8" y1="18" x2="21" y2="18"></line>
                                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                <line x1="3" y1="18" x2="3.01" y2="18"></line>
                            </svg>
                        </div>
                        <div class="link-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                            </svg>
                        </div>
                        <div class="link-info">
                            <div class="link-title">${link.title}</div>
                            <div class="link-url">${link.url}</div>
                        </div>
                        <div class="link-actions">
                            <button class="link-action-btn" onclick="dashboard.editLink(${link.id})" title="Edit">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="link-action-btn" onclick="dashboard.deleteLink(${link.id})" title="Delete">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        this.setupAddLink();
    }

    setupAddLink() {
        const btn = document.getElementById('addLinkBtn');
        if (!btn) return;

        btn.addEventListener('click', () => {
            this.showModal('Add Link', `
                <form id="linkForm">
                    <div class="form-group">
                        <label class="form-label">Title</label>
                        <input type="text" class="form-input" id="linkTitle" required placeholder="My Website">
                    </div>
                    <div class="form-group">
                        <label class="form-label">URL</label>
                        <input type="url" class="form-input" id="linkUrl" required placeholder="https://example.com">
                    </div>
                </form>
            `, async () => {
                const title = document.getElementById('linkTitle').value;
                const url = document.getElementById('linkUrl').value;

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
                        return true;
                    } else {
                        throw new Error('Failed to add link');
                    }
                } catch (error) {
                    this.showToast('Failed to add link', 'error');
                    return false;
                }
            });
        });
    }

    async editLink(id) {
        const links = await this.fetchLinks();
        const link = links.find(l => l.id === id);
        if (!link) return;

        this.showModal('Edit Link', `
            <form id="linkForm">
                <div class="form-group">
                    <label class="form-label">Title</label>
                    <input type="text" class="form-input" id="linkTitle" required value="${link.title}">
                </div>
                <div class="form-group">
                    <label class="form-label">URL</label>
                    <input type="url" class="form-input" id="linkUrl" required value="${link.url}">
                </div>
            </form>
        `, async () => {
            const title = document.getElementById('linkTitle').value;
            const url = document.getElementById('linkUrl').value;

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
                    return true;
                } else {
                    throw new Error('Failed to update');
                }
            } catch (error) {
                this.showToast('Failed to update link', 'error');
                return false;
            }
        });
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Files</h1>
                    <p class="page-subtitle">Secure file storage with E2EE encryption</p>
                </div>
            </div>
            
            <div class="upload-area" id="uploadArea">
                <input type="file" id="fileInput" style="display: none;" multiple>
                <div class="upload-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                </div>
                <h3 style="margin-bottom: 8px;">Select or drop files</h3>
                <p style="color: var(--text-muted); margin-bottom: 16px;">Files up to 200 MB. Encrypted end-to-end.</p>
                <button class="btn btn-primary">Choose Files</button>
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
                                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
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
        
        const socialPlatforms = [
            { id: 'discord', name: 'Discord', icon: 'discord', urlTemplate: 'https://discord.com/users/' },
            { id: 'discord_server', name: 'Discord Server', icon: 'discord', urlTemplate: 'https://discord.gg/' },
            { id: 'twitter', name: 'Twitter/X', icon: 'twitter', urlTemplate: 'https://x.com/' },
            { id: 'instagram', name: 'Instagram', icon: 'instagram', urlTemplate: 'https://instagram.com/' },
            { id: 'tiktok', name: 'TikTok', icon: 'tiktok', urlTemplate: 'https://tiktok.com/@' },
            { id: 'youtube', name: 'YouTube', icon: 'youtube', urlTemplate: 'https://youtube.com/@' },
            { id: 'twitch', name: 'Twitch', icon: 'twitch', urlTemplate: 'https://twitch.tv/' },
            { id: 'github', name: 'GitHub', icon: 'github', urlTemplate: 'https://github.com/' },
            { id: 'spotify', name: 'Spotify', icon: 'spotify', urlTemplate: 'https://open.spotify.com/user/' },
            { id: 'linkedin', name: 'LinkedIn', icon: 'linkedin', urlTemplate: 'https://linkedin.com/in/' },
            { id: 'snapchat', name: 'Snapchat', icon: 'snapchat', urlTemplate: 'https://snapchat.com/add/' },
            { id: 'pinterest', name: 'Pinterest', icon: 'pinterest', urlTemplate: 'https://pinterest.com/' },
            { id: 'reddit', name: 'Reddit', icon: 'reddit', urlTemplate: 'https://reddit.com/user/' },
            { id: 'telegram', name: 'Telegram', icon: 'telegram', urlTemplate: 'https://t.me/' },
            { id: 'steam', name: 'Steam', icon: 'steam', urlTemplate: 'https://steamcommunity.com/id/' },
            { id: 'paypal', name: 'PayPal', icon: 'paypal', urlTemplate: 'https://paypal.me/' },
            { id: 'cashapp', name: 'Cash App', icon: 'cashapp', urlTemplate: 'https://cash.app/$' },
            { id: 'venmo', name: 'Venmo', icon: 'venmo', urlTemplate: 'https://venmo.com/' },
            { id: 'onlyfans', name: 'OnlyFans', icon: 'onlyfans', urlTemplate: 'https://onlyfans.com/' },
            { id: 'patreon', name: 'Patreon', icon: 'patreon', urlTemplate: 'https://patreon.com/' },
            { id: 'soundcloud', name: 'SoundCloud', icon: 'soundcloud', urlTemplate: 'https://soundcloud.com/' },
            { id: 'apple_music', name: 'Apple Music', icon: 'apple_music', urlTemplate: 'https://music.apple.com/profile/' },
            { id: 'bandcamp', name: 'Bandcamp', icon: 'bandcamp', urlTemplate: 'https://bandcamp.com/' },
            { id: 'facebook', name: 'Facebook', icon: 'facebook', urlTemplate: 'https://facebook.com/' },
            { id: 'threads', name: 'Threads', icon: 'threads', urlTemplate: 'https://threads.net/@' },
            { id: 'bluesky', name: 'Bluesky', icon: 'bluesky', urlTemplate: 'https://bsky.app/profile/' },
            { id: 'mastodon', name: 'Mastodon', icon: 'mastodon', urlTemplate: '' },
            { id: 'kick', name: 'Kick', icon: 'kick', urlTemplate: 'https://kick.com/' },
            { id: 'rumble', name: 'Rumble', icon: 'rumble', urlTemplate: 'https://rumble.com/' }
        ];

        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Connections</h1>
                    <p class="page-subtitle">Connect your social accounts - Click username to copy, click icon to visit</p>
                </div>
            </div>
            
            <div class="cards-grid">
                ${socialPlatforms.map(platform => {
                    const conn = connections.find(c => c.platform === platform.id);
                    const profileUrl = conn?.profile_url || (conn?.username ? platform.urlTemplate + conn.username.replace('@', '') : '');
                    return `
                        <div class="card connection-card" style="padding: 20px;">
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <div class="card-icon" style="background: var(--bg-tertiary); cursor: ${conn && profileUrl ? 'pointer' : 'default'};" 
                                    ${conn && profileUrl ? `onclick="window.open('${profileUrl}', '_blank')" title="Visit profile"` : ''}>
                                    <img src="/static/cdn/${platform.icon}.png" alt="${platform.name}" style="width: 24px; height: 24px;" onerror="this.style.display='none'">
                                </div>
                                <div style="flex: 1; min-width: 0;">
                                    <h4>${platform.name}</h4>
                                    ${conn ? `
                                        <p style="font-size: 13px; color: var(--accent-secondary); cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                                           onclick="navigator.clipboard.writeText('${conn.username || ''}'); dashboard.showToast('Username copied!', 'success');" 
                                           title="Click to copy username">
                                            ${conn.username || 'Connected'}
                                        </p>
                                    ` : `
                                        <p style="font-size: 13px; color: var(--text-muted);">Not connected</p>
                                    `}
                                </div>
                                <div style="display: flex; gap: 8px;">
                                    ${conn ? `
                                        <button class="btn btn-secondary" style="padding: 8px 12px;" onclick="dashboard.editConnection('${platform.id}', '${conn.username || ''}', '${conn.profile_url || ''}')" title="Edit">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button class="btn btn-danger" style="padding: 8px 12px;" onclick="dashboard.disconnectPlatform('${platform.id}')" title="Disconnect">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
                                        </button>
                                    ` : `
                                        <button class="btn btn-primary" style="padding: 8px 16px;" onclick="dashboard.connectPlatform('${platform.id}', '${platform.name}')">Connect</button>
                                    `}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    connectPlatform(platform, platformName) {
        const isDiscordServer = platform === 'discord_server';
        this.showModal(`Connect ${platformName || platform.charAt(0).toUpperCase() + platform.slice(1)}`, `
            <form id="connectionForm">
                <div class="form-group">
                    <label class="form-label">${isDiscordServer ? 'Server Invite Code' : 'Username / Handle'}</label>
                    <input type="text" class="form-input" id="connectionUsername" required placeholder="${isDiscordServer ? 'abc123 (from discord.gg/abc123)' : '@username'}">
                </div>
                <div class="form-group">
                    <label class="form-label">${isDiscordServer ? 'Server Invite URL' : 'Profile URL'} (optional)</label>
                    <input type="url" class="form-input" id="connectionUrl" placeholder="${isDiscordServer ? 'https://discord.gg/...' : 'https://...'}">
                </div>
            </form>
        `, async () => {
            const username = document.getElementById('connectionUsername').value;
            const url = document.getElementById('connectionUrl').value;

            try {
                const response = await fetch('/api/connections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ platform, username, profile_url: url })
                });

                if (response.ok) {
                    this.showToast('Connection added', 'success');
                    this.renderConnections();
                    return true;
                } else {
                    throw new Error('Failed to connect');
                }
            } catch (error) {
                this.showToast('Failed to add connection', 'error');
                return false;
            }
        });
    }

    editConnection(platform, currentUsername, currentUrl) {
        const isDiscordServer = platform === 'discord_server';
        this.showModal(`Edit ${platform.charAt(0).toUpperCase() + platform.slice(1).replace('_', ' ')}`, `
            <form id="connectionForm">
                <div class="form-group">
                    <label class="form-label">${isDiscordServer ? 'Server Invite Code' : 'Username / Handle'}</label>
                    <input type="text" class="form-input" id="connectionUsername" required value="${currentUsername}" placeholder="${isDiscordServer ? 'abc123' : '@username'}">
                </div>
                <div class="form-group">
                    <label class="form-label">${isDiscordServer ? 'Server Invite URL' : 'Profile URL'} (optional)</label>
                    <input type="url" class="form-input" id="connectionUrl" value="${currentUrl}" placeholder="https://...">
                </div>
            </form>
        `, async () => {
            const username = document.getElementById('connectionUsername').value;
            const url = document.getElementById('connectionUrl').value;

            try {
                const response = await fetch(`/api/connections/${platform}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ username, profile_url: url })
                });

                if (response.ok) {
                    this.showToast('Connection updated', 'success');
                    this.renderConnections();
                    return true;
                } else {
                    throw new Error('Failed to update');
                }
            } catch (error) {
                this.showToast('Failed to update connection', 'error');
                return false;
            }
        });
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

    async renderSettings() {
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 class="card-title">Preferences</h3>
                        <p class="card-description">Customize your experience</p>
                    </div>
                </div>
                
                <div class="card-item">
                    <div class="item-info">
                        <span class="item-label">Dark Mode</span>
                        <span class="item-value">Currently active</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" checked disabled>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                
                <div class="card-item">
                    <div class="item-info">
                        <span class="item-label">Email Notifications</span>
                        <span class="item-value">Receive updates about your account</span>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                
                <div class="card-item">
                    <div class="item-info">
                        <span class="item-label">Analytics</span>
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
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                            <span class="item-label">Public Profile</span>
                            <span class="item-value">Anyone can view your profile</span>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Show in Search</span>
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
                        <div class="card-icon success">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Data & Privacy</h3>
                            <p class="card-description">Manage your data</p>
                        </div>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Download Data</span>
                            <span class="item-value">Get a copy of your data</span>
                        </div>
                        <button class="btn btn-secondary" style="padding: 8px 16px;">Download</button>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Usage Analytics</span>
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

    // Admin Pages
    async renderAdminUsers() {
        const adminRoles = ['owner', 'admin', 'manager', 'mod'];
        if (!adminRoles.includes(this.user?.role)) {
            this.loadPage('overview');
            return;
        }

        const contentArea = document.getElementById('contentArea');
        
        try {
            const response = await fetch('/api/admin/users', { credentials: 'include' });
            let users = [];
            if (response.ok) {
                const data = await response.json();
                users = data.users || [];
            }

            contentArea.innerHTML = `
                <div class="page-header">
                    <button class="page-back" onclick="dashboard.loadPage('overview')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <div>
                        <h1 class="page-title">User Management</h1>
                        <p class="page-subtitle">Manage all registered users</p>
                    </div>
                </div>
                
                <div class="card">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.length === 0 ? '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No users found</td></tr>' : 
                              users.map(u => `
                                <tr>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:12px;">
                                            <img src="${u.avatar_url || '/static/cdn/avatar.png'}" style="width:32px;height:32px;border-radius:50%;">
                                            <div>
                                                <div style="font-weight:500;">${u.display_name || u.username}</div>
                                                <div style="color:var(--text-muted);font-size:12px;">@${u.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span class="badge ${u.role === 'owner' ? 'warning' : u.role === 'admin' ? 'danger' : 'success'}">${u.role}</span></td>
                                    <td style="color:var(--text-muted);">${new Date(u.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;">Edit</button>
                                    </td>
                                </tr>
                              `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            contentArea.innerHTML = `<div class="empty-state"><h3>Error loading users</h3><p>${error.message}</p></div>`;
        }
    }

    async renderAdminInvites() {
        const adminRoles = ['owner', 'admin', 'manager', 'mod'];
        if (!adminRoles.includes(this.user?.role)) {
            this.loadPage('overview');
            return;
        }

        const contentArea = document.getElementById('contentArea');
        
        try {
            const response = await fetch('/api/invites', { credentials: 'include' });
            let invites = [];
            if (response.ok) {
                const data = await response.json();
                invites = data.invites || [];
            }

            contentArea.innerHTML = `
                <div class="page-header">
                    <button class="page-back" onclick="dashboard.loadPage('overview')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <div>
                        <h1 class="page-title">Invite Management</h1>
                        <p class="page-subtitle">Create and manage invite codes</p>
                    </div>
                </div>
                
                <div style="margin-bottom: 24px;">
                    <button class="btn btn-primary" onclick="dashboard.createInvite()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Create Invite
                    </button>
                </div>
                
                <div class="card">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Uses</th>
                                <th>Created By</th>
                                <th>Expires</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invites.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">No invites found</td></tr>' : 
                              invites.map(inv => `
                                <tr>
                                    <td><code style="color:var(--accent-secondary);">${inv.code}</code></td>
                                    <td>${inv.uses || 0}/${inv.max_uses || '∞'}</td>
                                    <td style="color:var(--text-muted);">@${inv.created_by || 'system'}</td>
                                    <td style="color:var(--text-muted);">${inv.expires_at ? new Date(inv.expires_at).toLocaleDateString() : 'Never'}</td>
                                    <td>
                                        <button class="btn btn-secondary" style="padding:6px 12px;font-size:12px;" onclick="navigator.clipboard.writeText('${inv.code}'); dashboard.showToast('Code copied!', 'success');">Copy</button>
                                    </td>
                                </tr>
                              `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            contentArea.innerHTML = `<div class="empty-state"><h3>Error loading invites</h3><p>${error.message}</p></div>`;
        }
    }

    async createInvite() {
        this.showModal('Create Invite', `
            <div class="form-group">
                <label class="form-label">Max Uses (leave empty for unlimited)</label>
                <input type="number" class="form-input" id="inviteMaxUses" min="1" placeholder="Unlimited">
            </div>
            <div class="form-group">
                <label class="form-label">Expires In (hours, leave empty for never)</label>
                <input type="number" class="form-input" id="inviteExpires" min="1" placeholder="Never">
            </div>
        `, async () => {
            const maxUses = document.getElementById('inviteMaxUses').value;
            const expiresIn = document.getElementById('inviteExpires').value;

            try {
                const response = await fetch('/api/invites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        max_uses: maxUses ? parseInt(maxUses) : null,
                        expires_in: expiresIn ? parseInt(expiresIn) : null
                    })
                });

                if (response.ok) {
                    this.showToast('Invite created successfully', 'success');
                    this.loadPage('admin-invites');
                } else {
                    throw new Error('Failed to create invite');
                }
            } catch (error) {
                this.showToast('Failed to create invite', 'error');
                return false;
            }
        });
    }

    async renderAdminFiles() {
        const adminRoles = ['owner', 'admin', 'manager', 'mod'];
        if (!adminRoles.includes(this.user?.role)) {
            this.loadPage('overview');
            return;
        }

        const contentArea = document.getElementById('contentArea');
        
        try {
            const response = await fetch('/api/admin/files', { credentials: 'include' });
            let files = [];
            if (response.ok) {
                const data = await response.json();
                files = data.files || [];
            }

            contentArea.innerHTML = `
                <div class="page-header">
                    <button class="page-back" onclick="dashboard.loadPage('overview')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <div>
                        <h1 class="page-title">All Files</h1>
                        <p class="page-subtitle">View and manage all uploaded files</p>
                    </div>
                </div>
                
                <div class="card">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>File</th>
                                <th>Uploader</th>
                                <th>Size</th>
                                <th>Downloads</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${files.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">No files found</td></tr>' : 
                              files.map(f => `
                                <tr>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:12px;">
                                            <div style="width:32px;height:32px;background:var(--bg-tertiary);border-radius:6px;display:flex;align-items:center;justify-content:center;">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" stroke-width="2">
                                                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                                    <polyline points="13 2 13 9 20 9"></polyline>
                                                </svg>
                                            </div>
                                            <div>
                                                <div style="font-weight:500;">${f.filename || f.original_filename}</div>
                                                <div style="color:var(--text-muted);font-size:12px;">/file/${f.code}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style="color:var(--text-muted);">@${f.username || 'unknown'}</td>
                                    <td style="color:var(--text-muted);">${this.formatFileSize(f.size || f.file_size || 0)}</td>
                                    <td style="color:var(--text-muted);">${f.download_count || 0}</td>
                                    <td style="color:var(--text-muted);">${new Date(f.created_at).toLocaleDateString()}</td>
                                </tr>
                              `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            contentArea.innerHTML = `<div class="empty-state"><h3>Error loading files</h3><p>${error.message}</p></div>`;
        }
    }

    async renderAdminAnalytics() {
        const adminRoles = ['owner', 'admin', 'manager', 'mod'];
        if (!adminRoles.includes(this.user?.role)) {
            this.loadPage('overview');
            return;
        }

        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Analytics</h1>
                    <p class="page-subtitle">Platform usage and statistics</p>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3>-</h3>
                        <p>Total Users</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--success);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3>-</h3>
                        <p>Total Files</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: var(--warning);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <h3>-</h3>
                        <p>Total Links</p>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                    </div>
                    <div>
                        <h3 class="card-title">Platform Activity</h3>
                        <p class="card-description">Analytics coming soon</p>
                    </div>
                </div>
                <div class="empty-state" style="padding: 40px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                    <h3>Analytics Dashboard</h3>
                    <p>Detailed analytics and reporting features will be available here.</p>
                </div>
            </div>
        `;
    }

    // API Methods
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

    // Utility Methods
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showToast(message, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${type === 'success' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' : 
                  type === 'error' ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>' :
                  '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'}
            </svg>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showUpdateDetails(id, title, description, details, createdAt) {
        const formatUpdateDate = (dateStr) => {
            const date = new Date(dateStr);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        };

        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-content">
                    <p style="color: var(--text-muted); margin-bottom: 8px; font-size: 12px;">${formatUpdateDate(createdAt)}</p>
                    <p style="color: var(--text-secondary); margin-bottom: 16px;">${description}</p>
                    <div style="background: var(--bg-tertiary); border-radius: 8px; padding: 16px;">
                        <p style="color: var(--text-primary); line-height: 1.6; white-space: pre-line;">${details}</p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary modal-close-btn" style="width: 100%;">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => modal.classList.add('active'));

        const close = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('.modal-close').addEventListener('click', close);
        modal.querySelector('.modal-close-btn').addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });
    }

    showModal(title, content, onConfirm) {
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    <button class="modal-close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div class="modal-content">${content}</div>
                <div class="modal-actions">
                    <button class="btn btn-secondary modal-cancel">Cancel</button>
                    <button class="btn btn-primary modal-confirm">Confirm</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        requestAnimationFrame(() => modal.classList.add('active'));

        const close = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('.modal-close').addEventListener('click', close);
        modal.querySelector('.modal-cancel').addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });

        modal.querySelector('.modal-confirm').addEventListener('click', async () => {
            if (onConfirm) {
                const result = await onConfirm();
                if (result !== false) close();
            } else {
                close();
            }
        });
    }
}

const dashboard = new Dashboard();
