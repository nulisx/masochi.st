class Dashboard {
    constructor() {
        this.user = null;
        this.currentPage = 'overview';
        this.updates = [];
    }

    async init() {
        
        if (window.__dashboardInitialized || window.__dashboardInitStarted) {
            console.log('Dashboard already initializing/initialized');
            return;
        }
        window.__dashboardInitStarted = true;
        
        try {
            console.log('📊 Dashboard init starting...');
            
            
            const response = await fetch('/api/auth/me', { 
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            console.log('📡 /api/auth/me status:', response.status);
            
            if (!response.ok) {
                console.error('❌ Not authenticated, redirecting to /login');
                window.location.replace('/login');
                return;
            }
            
            const data = await response.json();
            this.user = data.user || data;
            
            if (!this.user || !this.user.id) {
                console.error('❌ Invalid user data');
                window.location.replace('/login');
                return;
            }
            
            console.log('✅ User authenticated:', this.user.username);
            sessionStorage.setItem('user', JSON.stringify(this.user));
            localStorage.setItem('user', JSON.stringify(this.user));
            
            
            window.__dashboardInitialized = true;
            
            try {
                this.setupUI();
                this.loadPage('overview');
                console.log('✅ Dashboard fully loaded');
            } catch (uiError) {
                console.error('❌ UI setup error:', uiError);
                
            }
            
        } catch (error) {
            console.error('❌ Dashboard init error:', error);
            
            if (!window.__dashboardInitialized) {
                window.location.replace('/login');
            }
        }
    }

    setupUI() {
        
        if (window.__uiSetup) {
            console.log('⏭️  UI already setup, skipping');
            return;
        }
        window.__uiSetup = true;
        
        
        const headerUserName = document.getElementById('headerUserName');
        if (headerUserName) {
            headerUserName.textContent = this.user?.display_name || this.user?.username || 'User';
        }
        
        const roleDisplay = document.getElementById('roleDisplay');
        if (roleDisplay) {
            roleDisplay.textContent = `${this.user?.role || 'user'}@${this.user?.username}.glowi.es`;
        }
        
        const headerAvatar = document.getElementById('headerAvatar');
        if (headerAvatar) {
            headerAvatar.src = this.user?.avatar_url || '/static/cdn/avatar.png';
        }
        
        
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = this.user?.display_name || this.user?.username || 'User';
        }
        
        const userHandle = document.getElementById('userHandle');
        if (userHandle) {
            userHandle.textContent = `@${this.user?.username}`;
        }
        
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.src = this.user?.avatar_url || '/static/cdn/avatar.png';
        }

        this.setupSidebar();
        this.setupHeaderDropdown();
        this.setupSearchBar();
        this.setupModalStyles();
        console.log('✅ UI setup complete');
    }

    setupHeaderDropdown() {
        const headerDropdownBtn = document.getElementById('headerDropdownBtn');
        const headerDropdownMenu = document.getElementById('headerDropdownMenu');
        
        if (headerDropdownBtn && headerDropdownMenu) {
            headerDropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = headerDropdownMenu.style.display === 'block';
                headerDropdownMenu.style.display = isOpen ? 'none' : 'block';
                headerDropdownBtn.textContent = isOpen ? '˅' : '^';
            });
            
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.header-user')) {
                    headerDropdownMenu.style.display = 'none';
                    headerDropdownBtn.textContent = '˅';
                }
            });
        }
    }

    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebarToggle');
        
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                sidebarToggle.textContent = sidebar.classList.contains('collapsed') ? '>' : '<';
            });
        }
        
        const dropdownBtn = document.getElementById('userDropdownBtn');
        const dropdownMenu = document.getElementById('userDropdownMenu');
        const dropdownToggle = document.getElementById('dropdownToggle');
        
        if (dropdownBtn && dropdownMenu) {
            dropdownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('open');
                dropdownToggle.textContent = dropdownMenu.classList.contains('open') ? '^' : '˅';
            });
            
            document.addEventListener('click', () => {
                dropdownMenu.classList.remove('open');
                dropdownToggle.textContent = '˅';
            });
        }
        
        const dropdownLogout = document.getElementById('dropdownLogout');
        if (dropdownLogout) {
            dropdownLogout.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
                } catch (err) {
                    console.error('Logout failed:', err);
                }
                window.location.replace('/login');
            });
        }
        
        const dropdownItems = document.querySelectorAll('.dropdown-item[data-page]');
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    this.loadPage(page);
                    document.querySelectorAll('.nav-item[data-page]').forEach(i => i.classList.remove('active'));
                    dropdownMenu.classList.remove('open');
                    dropdownToggle.textContent = '˅';
                }
            });
        });
        
        const navLabels = document.querySelectorAll('.nav-label');
        navLabels.forEach(label => {
            label.parentElement.addEventListener('click', (e) => {
                e.stopPropagation();
                const section = label.dataset.section;
                const dot = label.parentElement.querySelector('.nav-dot');
                const navSection = label.closest('.nav-section');
                const items = navSection.querySelectorAll('.nav-item');
                
                items.forEach(item => {
                    item.style.display = item.style.display === 'none' ? 'flex' : 'none';
                });
                
                if (dot) {
                    dot.classList.toggle('collapsed');
                }
            });
        });
        
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

        const dashboardFeatures = [
            { title: 'Dashboard', description: 'View your dashboard overview', page: 'overview', keywords: ['overview', 'dashboard', 'home'] },
            { title: 'Profile', description: 'Manage your profile information', page: 'profile', keywords: ['profile', 'user', 'account'] },
            { title: 'Biolinks', description: 'Create and manage your biolinks', page: 'biolinks', keywords: ['biolink', 'link', 'url'] },
            { title: 'Images', description: 'Upload and manage your images', page: 'files', keywords: ['image', 'images', 'media', 'photo', 'upload'] },
            { title: 'Files', description: 'Manage your hosted files', page: 'files', keywords: ['file', 'files', 'upload', 'download'] },
            { title: 'LitterBox', description: 'Temporary file hosting service', page: 'litterbox', keywords: ['litterbox', 'temporary', 'file', 'trash'] },
            { title: 'Security', description: 'Manage account security settings', page: 'security', keywords: ['security', 'password', '2fa', 'authentication', 'recovery'] },
            { title: 'Connections', description: 'Connect external accounts', page: 'connections', keywords: ['connection', 'social', 'account', 'linked', 'integration'] },
            { title: 'Settings', description: 'Configure your preferences', page: 'settings', keywords: ['setting', 'settings', 'config', 'preference', 'customize'] },
            { title: 'Privacy', description: 'Control your privacy settings', page: 'privacy', keywords: ['privacy', 'visibility', 'private', 'public', 'profile'] },
            { title: 'Terms of Service', description: 'View terms and conditions', page: 'tos', keywords: ['terms', 'tos', 'service', 'agreement'] }
        ];

        let searchTimeout;
        let cachedResults = {};

        const handleSearch = (query) => {
            const resultsContainer = document.getElementById('searchResults');
            if (!resultsContainer) return;

            if (query.length === 0) {
                resultsContainer.style.display = 'none';
                return;
            }

            if (cachedResults[query]) {
                this.displaySearchResults(cachedResults[query], resultsContainer);
                return;
            }

            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                let results = [];

                const queryLower = query.toLowerCase();
                results.push(...dashboardFeatures.filter(f =>
                    f.title.toLowerCase().includes(queryLower) ||
                    f.description.toLowerCase().includes(queryLower) ||
                    f.keywords.some(k => k.includes(queryLower))
                ).map(f => ({ type: 'feature', item: f })));

                cachedResults[query] = results;
                this.displaySearchResults(results, resultsContainer);
            }, 200);
        };

        searchInput.addEventListener('input', (e) => {
            handleSearch(e.target.value.toLowerCase().trim());
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        });

        document.addEventListener('click', (e) => {
            const resultsContainer = document.getElementById('searchResults');
            if (resultsContainer && !e.target.closest('.search-container')) {
                resultsContainer.style.display = 'none';
            }
        });
    }

    displaySearchResults(results, container) {
        if (results.length === 0) {
            container.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted);">No results found</div>';
            container.style.display = 'block';
            return;
        }

        const html = results.slice(0, 8).map(r => {
            if (r.type === 'feature') {
                return `<div class="search-result-item" onclick="dashboard.loadPage('${r.item.page}'); document.getElementById('searchResults').style.display='none';" style="padding: 12px 16px; border-bottom: 1px solid rgba(168,85,247,0.1); cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; gap: 4px;" onmouseover="this.style.backgroundColor='rgba(168,85,247,0.08)'" onmouseout="this.style.backgroundColor='transparent'"><strong style="color: #a855f7; font-size: 14px;">${r.item.title}</strong><p style="color: var(--text-muted); font-size: 12px; margin: 0;">${r.item.description}</p></div>`;
            } else if (r.type === 'link') {
                return `<div class="search-result-item" onclick="dashboard.loadPage('biolinks'); document.getElementById('searchResults').style.display='none';" style="padding: 12px 16px; border-bottom: 1px solid rgba(168,85,247,0.1); cursor: pointer;"><strong style="color: #a855f7;">${r.item.title}</strong><p style="color: var(--text-muted); font-size: 12px; margin: 0;">${r.item.url}</p></div>`;
            } else if (r.type === 'file') {
                return `<div class="search-result-item" onclick="dashboard.loadPage('files'); document.getElementById('searchResults').style.display='none';" style="padding: 12px 16px; border-bottom: 1px solid rgba(168,85,247,0.1); cursor: pointer;"><strong style="color: #a855f7;">${r.item.filename}</strong><p style="color: var(--text-muted); font-size: 12px; margin: 0;">${this.formatFileSize(r.item.size || 0)}</p></div>`;
            }
            return '';
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
        if (!contentArea) {
            console.error('❌ Content area not found');
            return;
        }

        try {
            contentArea.style.opacity = '0';
            contentArea.style.transition = 'opacity 0.3s ease';
            
            setTimeout(async () => {
                try {
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
                    
                    
                    const area = document.getElementById('contentArea');
                    if (area && area.innerHTML.trim()) {
                        area.style.opacity = '1';
                    } else {
                        console.error('❌ Content not rendered properly');
                    }
                } catch (renderError) {
                    console.error('❌ Render error:', renderError);
                    const area = document.getElementById('contentArea');
                    if (area) {
                        area.innerHTML = `<div class="empty-state"><h3>Error loading page</h3><p>${renderError.message}</p></div>`;
                        area.style.opacity = '1';
                    }
                }
            }, 150);
        } catch (error) {
            console.error('❌ Error loading page:', error);
            if (contentArea) {
                contentArea.innerHTML = `<div class="empty-state"><h3>Error loading page</h3><p>${error.message}</p></div>`;
                contentArea.style.opacity = '1';
            }
        }
    }

    async renderOverview() {
        
        const [profile, links, files, statsRes, updatesRes] = await Promise.all([
            this.fetchProfile(),
            this.fetchLinks(),
            this.fetchFiles(),
            fetch('/api/profile/stats', { credentials: 'include' }).then(r => r.ok ? r.json() : { uid: this.user?.id || 0, storage_used: 0, storage_limit: 1073741824, license_status: 'Inactive' }).catch(() => ({ uid: this.user?.id || 0, storage_used: 0, storage_limit: 1073741824, license_status: 'Inactive' })),
            fetch('/api/updates', { credentials: 'include' }).then(r => r.ok ? r.json() : { updates: [] }).catch(() => ({ updates: [] }))
        ]);
        
        let stats = statsRes || { uid: this.user?.id || 0, storage_used: 0, storage_limit: 1073741824, license_status: 'Inactive' };
        let updates = updatesRes?.updates || [];
        
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
                            <p style="color: var(--text-muted); font-size: 12px; margin-top: 6px;">Letters and numbers only. 1-20 characters. Special characters allowed: !, @, $, %, &, *</p>
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

            if (!/^[a-zA-Z0-9!@$%&*]+$/.test(newUsername)) {
                this.showToast('Username can only contain letters, numbers, and special characters: !, @, $, %, &, *', 'error');
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
        
        
        let passwordText = 'Last changed recently';
        if (this.user?.password_changed_at) {
            const now = new Date();
            const changed = new Date(this.user.password_changed_at);
            const diffMs = now - changed;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            if (diffMins < 60) passwordText = `Last changed ${diffMins}m ago`;
            else if (diffHours < 24) passwordText = `Last changed ${diffHours}h ago`;
            else if (diffDays < 7) passwordText = `Last changed ${diffDays}d ago`;
            else passwordText = `Last changed ${changed.toLocaleDateString()}`;
        }
        
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
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <div class="card" style="border: 1px dashed rgba(168, 85, 247, 0.35); position: relative; overflow: hidden;">
                    <div class="card-header">
                        <div class="card-icon" style="background: rgba(168, 85, 247, 0.15); color: #a855f7;">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path d="M12 2L4 7V12C4 18 12 22 12 22S20 18 20 12V7L12 2Z" fill="#a855f7"/>
                                <line x1="12" y1="7" x2="12" y2="20" stroke="#0f0f11" stroke-width="1.2" stroke-linecap="round"/>
                                <line x1="6" y1="13" x2="18" y2="13" stroke="#0f0f11" stroke-width="1.2" stroke-linecap="round"/>
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
                        <button id="enable2FABtn" class="security-btn" style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.2); color: #a855f7; font-size: 12px; cursor: pointer; font-weight: 500; padding: 6px 12px; border-radius: 6px; transition: all 0.2s ease;">Enable</button>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Active Sessions</span>
                            <span class="item-value">0 active</span>
                        </div>
                        <button class="security-btn" style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.2); color: #a855f7; font-size: 12px; cursor: pointer; font-weight: 500; padding: 6px 12px; border-radius: 6px; transition: all 0.2s ease;">Manage</button>
                    </div>
                    
                    <div class="card-item">
                        <div class="item-info">
                            <span class="item-label">Password</span>
                            <span class="item-value">${passwordText}</span>
                        </div>
                        <button id="changePasswordBtn" class="security-btn" style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.2); color: #a855f7; font-size: 12px; cursor: pointer; font-weight: 500; padding: 6px 12px; border-radius: 6px; transition: all 0.2s ease;">Change</button>
                    </div>
                    
                    <div style="position: absolute; bottom: -50px; right: 25px; width: 150px; height: 150px; pointer-events: none; display: flex; align-items: center; justify-content: center;">
                        <svg width="120" height="120" viewBox="0 0 24 24" style="opacity: 0.08; fill: #a855f7; transform: rotate(25deg);" xmlns="http:
                                <path d="M12 2L4 7V12C4 18 12 22 12 22S20 18 20 12V7L12 2Z" fill="#a855f7"/>
                                <line x1="12" y1="7" x2="12" y2="20" stroke="#0f0f11" stroke-width="1.2" stroke-linecap="round"/>
                                <line x1="6" y1="13" x2="18" y2="13" stroke="#0f0f11" stroke-width="1.2" stroke-linecap="round"/>
                            </svg>
                        </svg>
                    </div>
                </div>
                
                <div class="card" style="border: 1px dashed rgba(168, 85, 247, 0.35); position: relative; overflow: hidden;">
                    <div class="card-header">
                        <div class="card-icon" style="background: rgba(168, 85, 247, 0.15); color: #a855f7;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
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
                    
                    <div style="position: absolute; bottom: -50px; right: 10px; width: 150px; height: 150px; pointer-events: none; display: flex; align-items: center; justify-content: center;">
                        <svg width="120" height="120" viewBox="0 0 24 24" style="opacity: 0.08; stroke: #a855f7; transform: rotate(25deg);" xmlns="http:
                            <path d="M21.821 12.43c-.083-.119-2.062-2.944-4.793-4.875-1.416-1.003-3.202-1.555-5.028-1.555-1.825 0-3.611.552-5.03 1.555-2.731 1.931-4.708 4.756-4.791 4.875-.238.343-.238.798 0 1.141.083.119 2.06 2.944 4.791 4.875 1.419 1.002 3.205 1.554 5.03 1.554 1.826 0 3.612-.552 5.028-1.555 2.731-1.931 4.71-4.756 4.793-4.875.239-.342.239-.798 0-1.14zm-9.821 4.07c-1.934 0-3.5-1.57-3.5-3.5 0-1.934 1.566-3.5 3.5-3.5 1.93 0 3.5 1.566 3.5 3.5 0 1.93-1.57 3.5-3.5 3.5zM14 13c0 1.102-.898 2-2 2-1.105 0-2-.898-2-2 0-1.105.895-2 2-2 1.102 0 2 .895 2 2z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
                <div class="card" style="border: 1px dashed rgba(168, 85, 247, 0.35); position: relative; overflow: hidden;">
                    <div class="card-header">
                        <div class="card-icon" style="background: rgba(168, 85, 247, 0.15); color: #a855f7;">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http:
                                <path d="M10 21L7.18762 18.9912C4.55966 17.1141 3 14.0834 3 10.8538L3 5.75432C3 5.30784 3.29598 4.91546 3.72528 4.7928L9.72528 3.07852C9.90483 3.02721 10.0952 3.02721 10.2747 3.07852L16.2747 4.7928C16.704 4.91546 17 5.30784 17 5.75432V7.50002M19 15V13C19 11.8955 18.1046 11 17 11C15.8954 11 15 11.8955 15 13V15M19 15H15M19 15C20.1046 15 21 15.8955 21 17V19C21 20.1046 20.1046 21 19 21H15C13.8954 21 13 20.1046 13 19V17C13 15.8955 13.8954 15 15 15"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Data Protection</h3>
                            <p class="card-description">Manage your data collection preferences and download your information</p>
                        </div>
                    </div>
                    <span class="badge primary">● Protected</span>
                    <div style="position: absolute; bottom: -55px; right: -10px; width: 150px; height: 150px; pointer-events: none; display: flex; align-items: center; justify-content: center;">
                        <svg width="120" height="120" viewBox="0 0 24 24" style="opacity: 0.08; stroke: #a855f7; transform: rotate(25deg);" xmlns="http:
                            <path d="M10 21L7.18762 18.9912C4.55966 17.1141 3 14.0834 3 10.8538L3 5.75432C3 5.30784 3.29598 4.91546 3.72528 4.7928L9.72528 3.07852C9.90483 3.02721 10.0952 3.02721 10.2747 3.07852L16.2747 4.7928C16.704 4.91546 17 5.30784 17 5.75432V7.50002M19 15V13C19 11.8955 18.1046 11 17 11C15.8954 11 15 11.8955 15 13V15M19 15H15M19 15C20.1046 15 21 15.8955 21 17V19C21 20.1046 20.1046 21 19 21H15C13.8954 21 13 20.1046 13 19V17C13 15.8955 13.8954 15 15 15" stroke="rgba(168, 85, 247, 0.25)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <rect x="13" y="12" width="6" height="6" rx="1"></rect>
                            <path d="M16 12V9a1 1 0 0 0-2 0"></path>
                        </svg>
                    </div>
                </div>
                
                <div class="card" style="border: 1px dashed rgba(168, 85, 247, 0.35); position: relative; overflow: hidden;">
                    <div class="card-header">
                        <div class="card-icon" style="background: rgba(168, 85, 247, 0.15); color: #a855f7;">
                            <svg width="20" height="20" viewBox="0 0 256 256" fill="#a855f7" xmlns="http:
                                <path d="M140,80v41.072l35.56934,20.53589a12,12,0,1,1-12,20.78467L122,138.39209c-.09375-.05408-.17773-.118-.26953-.17413-.20654-.12714-.41162-.25556-.60986-.39466-.15284-.10669-.29834-.2196-.44434-.33227-.15576-.12012-.31006-.2403-.45947-.36774-.165-.14038-.32227-.28644-.478-.43439-.12061-.11468-.24023-.22937-.356-.34893-.15918-.16419-.31054-.33313-.459-.50507-.105-.12115-.208-.24292-.30811-.36823-.1372-.17272-.26806-.34887-.395-.52813-.10156-.14282-.20068-.28675-.2959-.43415q-.16113-.25075-.30859-.50842c-.09961-.1723-.1958-.34625-.28711-.5238-.07959-.15564-.15478-.31287-.22754-.47156-.09179-.2-.1792-.40161-.26025-.6073-.0586-.14893-.11231-.299-.16455-.45007-.07471-.21479-.14551-.43079-.208-.65094-.0459-.15918-.085-.31946-.124-.48041-.0503-.21008-.09864-.42059-.1377-.63483-.03515-.19116-.062-.38336-.08789-.57623-.0249-.18481-.05029-.36908-.06641-.55652-.021-.23858-.02929-.4779-.03613-.71789-.00293-.1095-.0166-.21625-.0166-.32642V80a12,12,0,0,1,24,0Zm58.71094-22.71094a100.11523,100.11523,0,0,0-141.42188,0L43.8335,70.745V59.71582a12,12,0,1,0-24,0V99.71454c0,.39581.021.79144.06005,1.18567.01709.17651.0503.34784.0752.52209.03027.21326.05518.427.09717.63867.04.20008.09472.394.14453.5904.0459.1831.08594.36718.14062.5484.0586.19281.13086.3789.19873.5675.06446.18073.124.36267.19776.54077.07324.17652.15918.34565.24023.51777.08643.18286.16748.36718.26319.54638.08886.1651.18945.322.28515.48242.105.17548.2041.35315.31836.52424.11865.17681.25.3432.37744.51318.10743.14337.207.29053.32178.43q.36621.44651.77344.856c.00781.00745.01367.01569.021.02307s.01612.01361.02344.02112q.40869.40668.85547.77313c.1416.11658.2915.218.437.327.16748.12524.33155.25512.50537.37164.17383.11633.3545.21722.53272.32349.15771.094.31152.19317.47363.28009.18213.09729.36914.17981.55469.26709.16943.07989.33594.16449.50976.23651.18116.07513.3667.13586.55079.20172.18505.06628.36767.13733.55664.19464.18652.05646.376.098.56445.14514.19092.04792.37988.10156.57422.1402.21972.04358.4414.06989.6626.10114.1665.02343.32959.05535.498.07189.39649.03913.79395.06006,1.1919.05988H71.8335a12,12,0,0,0,0-24H60.8042l13.45557-13.456a76,76,0,1,1,0,107.48046,12.0001,12.0001,0,0,0-16.97071,16.97071A100.00037,100.00037,0,0,0,198.71094,57.28906Z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Login History</h3>
                            <p class="card-description">View recent login attempts and manage suspicious activity</p>
                        </div>
                    </div>
                    <span class="badge primary">● Up to date</span>
                    <div style="position: absolute; bottom: -55px; right: -10px; width: 150px; height: 150px; pointer-events: none; display: flex; align-items: center; justify-content: center;">
                        <svg width="120" height="120" viewBox="0 0 256 256" style="opacity: 0.08; fill: #a855f7; transform: rotate(25deg);" xmlns="http:
                            <path d="M140,80v41.072l35.56934,20.53589a12,12,0,1,1-12,20.78467L122,138.39209c-.09375-.05408-.17773-.118-.26953-.17413-.20654-.12714-.41162-.25556-.60986-.39466-.15284-.10669-.29834-.2196-.44434-.33227-.15576-.12012-.31006-.2403-.45947-.36774-.165-.14038-.32227-.28644-.478-.43439-.12061-.11468-.24023-.22937-.356-.34893-.15918-.16419-.31054-.33313-.459-.50507-.105-.12115-.208-.24292-.30811-.36823-.1372-.17272-.26806-.34887-.395-.52813-.10156-.14282-.20068-.28675-.2959-.43415q-.16113-.25075-.30859-.50842c-.09961-.1723-.1958-.34625-.28711-.5238-.07959-.15564-.15478-.31287-.22754-.47156-.09179-.2-.1792-.40161-.26025-.6073-.0586-.14893-.11231-.299-.16455-.45007-.07471-.21479-.14551-.43079-.208-.65094-.0459-.15918-.085-.31946-.124-.48041-.0503-.21008-.09864-.42059-.1377-.63483-.03515-.19116-.062-.38336-.08789-.57623-.0249-.18481-.05029-.36908-.06641-.55652-.021-.23858-.02929-.4779-.03613-.71789-.00293-.1095-.0166-.21625-.0166-.32642V80a12,12,0,0,1,24,0Zm58.71094-22.71094a100.11523,100.11523,0,0,0-141.42188,0L43.8335,70.745V59.71582a12,12,0,1,0-24,0V99.71454c0,.39581.021.79144.06005,1.18567.01709.17651.0503.34784.0752.52209.03027.21326.05518.427.09717.63867.04.20008.09472.394.14453.5904.0459.1831.08594.36718.14062.5484.0586.19281.13086.3789.19873.5675.06446.18073.124.36267.19776.54077.07324.17652.15918.34565.24023.51777.08643.18286.16748.36718.26319.54638.08886.1651.18945.322.28515.48242.105.17548.2041.35315.31836.52424.11865.17681.25.3432.37744.51318.10743.14337.207.29053.32178.43q.36621.44651.77344.856c.00781.00745.01367.01569.021.02307s.01612.01361.02344.02112q.40869.40668.85547.77313c.1416.11658.2915.218.437.327.16748.12524.33155.25512.50537.37164.17383.11633.3545.21722.53272.32349.15771.094.31152.19317.47363.28009.18213.09729.36914.17981.55469.26709.16943.07989.33594.16449.50976.23651.18116.07513.3667.13586.55079.20172.18505.06628.36767.13733.55664.19464.18652.05646.376.098.56445.14514.19092.04792.37988.10156.57422.1402.21972.04358.4414.06989.6626.10114.1665.02343.32959.05535.498.07189.39649.03913.79395.06006,1.1919.05988H71.8335a12,12,0,0,0,0-24H60.8042l13.45557-13.456a76,76,0,1,1,0,107.48046,12.0001,12.0001,0,0,0-16.97071,16.97071A100.00037,100.00037,0,0,0,198.71094,57.28906Z"/>                        </svg>
                    </div>
                </div>
                
                <div class="card" style="border: 1px dashed rgba(168, 85, 247, 0.35); position: relative; overflow: hidden;">
                    <div class="card-header">
                        <div class="card-icon" style="background: rgba(168, 85, 247, 0.15); color: #a855f7;">
                            <svg width="20" height="20" viewBox="0 0 1200 1200" xmlns="http:
                                <path d="M328.261,271.758C146.977,271.758,0,418.697,0,599.981c0,181.283,146.977,328.261,328.261,328.261c161.72,0,296.083-116.959,323.206-270.903c0.306,0.017,0.605,0.064,0.912,0.076h126.386v182.46h139.538v-182.46h65.796v264.068h139.538V657.414H1200V517.878H647.095c-0.322,0.026-0.63,0.048-0.95,0.076C609.721,376.371,481.219,271.758,328.261,271.758L328.261,271.758z M328.261,423.611c97.415,0,176.37,78.955,176.37,176.37c0,97.414-78.955,176.407-176.37,176.407s-176.408-78.993-176.408-176.407C151.853,502.566,230.847,423.611,328.261,423.611L328.261,423.611z"/>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">Account Recovery</h3>
                            <p class="card-description">Set up recovery methods and backup codes for account access</p>
                        </div>
                    </div>
                    <span class="badge warning">● Setup Required</span>
                    <div style="position: absolute; bottom: -50px; right: -10px; width: 150px; height: 150px; pointer-events: none; display: flex; align-items: center; justify-content: center;">
                        <svg width="120" height="120" viewBox="0 0 1200 1200" style="opacity: 0.08; transform: rotate(25deg);" xmlns="http:
                            <path d="M328.261,271.758C146.977,271.758,0,418.697,0,599.981c0,181.283,146.977,328.261,328.261,328.261c161.72,0,296.083-116.959,323.206-270.903c0.306,0.017,0.605,0.064,0.912,0.076h126.386v182.46h139.538v-182.46h65.796v264.068h139.538V657.414H1200V517.878H647.095c-0.322,0.026-0.63,0.048-0.95,0.076C609.721,376.371,481.219,271.758,328.261,271.758L328.261,271.758z M328.261,423.611c97.415,0,176.37,78.955,176.37,176.37c0,97.414-78.955,176.407-176.37,176.407s-176.408-78.993-176.408-176.407C151.853,502.566,230.847,423.611,328.261,423.611L328.261,423.611z"/>
                        </svg>
                    </div>
                </div>
            </div>
        `;

        this.setupSecurityHandlers();
    }
    
    setupSecurityHandlers() {
        const enable2FABtn = document.getElementById('enable2FABtn');
        if (enable2FABtn) {
            enable2FABtn.addEventListener('click', () => {
                this.loadPage('settings');
            });
        }
        
        const changePasswordBtn = document.getElementById('changePasswordBtn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.loadPage('settings');
            });
        }
        
        const manageBtn = document.querySelectorAll('.security-btn');
        manageBtn.forEach(btn => {
            btn.addEventListener('mouseover', () => {
                btn.style.background = 'rgba(168, 85, 247, 0.15)';
                btn.style.borderColor = 'rgba(168, 85, 247, 0.4)';
            });
            btn.addEventListener('mouseout', () => {
                btn.style.background = 'rgba(168, 85, 247, 0.1)';
                btn.style.borderColor = 'rgba(168, 85, 247, 0.2)';
            });
        });
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
                    <p class="page-subtitle">Account security and configuration</p>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">
                <!-- Change Password Card -->
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
                            <h3 class="card-title">Change Password</h3>
                        </div>
                    </div>
                    
                    <div style="padding: 20px;">
                        <form id="changePasswordForm">
                            <div class="form-group">
                                <label class="form-label">Current password</label>
                                <input type="password" class="form-input" id="currentPassword" placeholder="Your current password..." required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">New password</label>
                                <input type="password" class="form-input" id="newPassword" placeholder="Your new password..." required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Confirm password</label>
                                <input type="password" class="form-input" id="confirmPassword" placeholder="Confirm your password..." required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">2FA code (if required)</label>
                                <input type="text" class="form-input" id="twoFACode" placeholder="••••••" maxlength="6">
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%;">Change password</button>
                        </form>
                    </div>
                </div>

                <!-- 2FA Card -->
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
                            <h3 class="card-title">2FA</h3>
                        </div>
                    </div>
                    
                    <div style="padding: 20px;">
                        <div class="form-group">
                            <label class="form-label">Current password</label>
                            <input type="password" class="form-input" id="twoFAPassword" placeholder="••••••••">
                        </div>
                        <button class="btn btn-primary" id="enable2FABtn" style="width: 100%;">Enable</button>
                    </div>
                </div>
            </div>

            <!-- ShareX Section -->
            <div class="card">
                <div class="card-header">
                    <div class="card-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    </div>
                    <div>
                        <h3 class="card-title">ShareX</h3>
                        <p class="card-description">Configure ShareX for easy file uploads</p>
                    </div>
                </div>
                
                <div style="padding: 20px; display: flex; gap: 12px; flex-wrap: wrap;">
                    <button id="generateAPIKeyBtn" class="btn btn-primary">Generate API Key</button>
                    <button id="generateNormalConfigBtn" class="btn btn-primary">Generate Normal Configuration</button>
                    <button id="generateEncryptedConfigBtn" class="btn btn-primary">Generate Encrypted Configuration</button>
                </div>
            </div>
        `;

        this.setupSettingsHandlers();
    }

    setupSettingsHandlers() {
        
        const passwordForm = document.getElementById('changePasswordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const current = document.getElementById('currentPassword').value;
                const newPass = document.getElementById('newPassword').value;
                const confirm = document.getElementById('confirmPassword').value;
                const twoFA = document.getElementById('twoFACode').value;

                if (newPass !== confirm) {
                    this.showToast('Passwords do not match', 'error');
                    return;
                }

                if (newPass.length < 8) {
                    this.showToast('Password must be at least 8 characters', 'error');
                    return;
                }

                try {
                    const response = await fetch('/api/auth/change-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ current_password: current, new_password: newPass, twofa_code: twoFA })
                    });

                    if (response.ok) {
                        this.showToast('Password changed successfully', 'success');
                        passwordForm.reset();
                    } else {
                        const data = await response.json();
                        this.showToast(data.error || 'Failed to change password', 'error');
                    }
                } catch (error) {
                    this.showToast('Failed to change password', 'error');
                }
            });
        }

        
        const enable2FABtn = document.getElementById('enable2FABtn');
        if (enable2FABtn) {
            enable2FABtn.addEventListener('click', async () => {
                const password = document.getElementById('twoFAPassword').value;
                if (!password) {
                    this.showToast('Please enter your password', 'error');
                    return;
                }
                this.showToast('2FA setup coming soon', 'info');
            });
        }

        
        const generateAPIKeyBtn = document.getElementById('generateAPIKeyBtn');
        if (generateAPIKeyBtn) {
            generateAPIKeyBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch('/api/token', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: 'ShareX API Key' })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const apiKey = data.token;
                        this.showToast('API Key generated', 'success');
                        this.copyToClipboard(apiKey);
                    } else {
                        this.showToast('Failed to generate API key', 'error');
                    }
                } catch (error) {
                    this.showToast('Failed to generate API key', 'error');
                }
            });
        }

        const generateNormalConfigBtn = document.getElementById('generateNormalConfigBtn');
        if (generateNormalConfigBtn) {
            generateNormalConfigBtn.addEventListener('click', () => {
                const config = {
                    Version: "18.0.1",
                    Name: "Glowi.es",
                    DestinationType: "ImageUploader, FileUploader",
                    RequestMethod: "POST",
                    RequestURL: "${DOMAIN}/api/upload",
                    FileFormName: "file",
                    Arguments: `{
                        "token": "${this.user?.id}"
                    }`
                };
                this.downloadConfig(JSON.stringify(config, null, 2), 'glowi-config.json');
                this.showToast('Configuration generated', 'success');
            });
        }

        const generateEncryptedConfigBtn = document.getElementById('generateEncryptedConfigBtn');
        if (generateEncryptedConfigBtn) {
            generateEncryptedConfigBtn.addEventListener('click', () => {
                this.showToast('Encrypted configuration coming soon', 'info');
            });
        }
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Copied to clipboard', 'success');
        });
    }

    downloadConfig(content, filename) {
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
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
                    <p class="page-subtitle">Manage and customize your bio link collection</p>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
                <div class="card" style="padding: 20px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 600; color: var(--accent-primary); margin-bottom: 8px;">${links.length}</div>
                    <p style="color: var(--text-muted); font-size: 14px;">Total Links</p>
                </div>
                <div class="card" style="padding: 20px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 600; color: var(--accent-secondary); margin-bottom: 8px;">0</div>
                    <p style="color: var(--text-muted); font-size: 14px;">Total Clicks</p>
                </div>
                <div class="card" style="padding: 20px; text-align: center;">
                    <div style="font-size: 32px; font-weight: 600; color: #a855f7; margin-bottom: 8px;">100%</div>
                    <p style="color: var(--text-muted); font-size: 14px;">Active Rate</p>
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
                        <p class="card-description">Create a new bio link with validation</p>
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
                        <input type="text" class="form-input" id="linkTitle" placeholder="e.g., My Portfolio" required maxlength="50">
                        <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Up to 50 characters</p>
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
                        <input type="url" class="form-input" id="linkUrl" placeholder="https://example.com" required>
                        <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;" id="linkUrlStatus"></p>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Add Link</button>
                </form>
            </div>
            
            <div style="margin-top: 24px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <h3 style="margin: 0;">Your Links${links.length > 0 ? ' (' + links.length + ')' : ''}</h3>
                    ${links.length > 0 ? '<span style="font-size: 12px; color: var(--text-muted);">Drag to reorder • Click to edit</span>' : ''}
                </div>
                <div id="linksGrid" style="display: flex; flex-direction: column; gap: 12px;">
                    ${links.length === 0 ? `
                        <div class="card" style="padding: 48px 20px; text-align: center;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px; opacity: 0.5;">
                                <path d="M15 7h3a5 5 0 0 1 0 10h-3"></path>
                                <path d="M9 17H6a5 5 0 0 1 0-10h3"></path>
                                <path d="M8 12h8"></path>
                            </svg>
                            <h3>No links added yet</h3>
                            <p style="color: var(--text-muted);">Create your first bio link above to get started</p>
                        </div>
                    ` : links.map((link, idx) => `
                        <div class="card" style="padding: 16px; display: flex; align-items: center; gap: 12px; cursor: move; transition: all 0.2s;" draggable="true" data-link-id="${link.id}" onclick="dashboard.editLink(${link.id})">
                            <div style="color: var(--text-muted); font-weight: 600; cursor: grab;">≡</div>
                            <div style="flex: 1;">
                                <h4 style="margin-bottom: 4px; color: var(--text-primary);">${link.title}</h4>
                                <p style="font-size: 12px; color: var(--text-muted); word-break: break-all; margin-bottom: 8px;">${link.url}</p>
                                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                    <span style="font-size: 11px; color: #22c55e; background: rgba(34,197,94,0.15); padding: 3px 8px; border-radius: 4px;">✓ Valid</span>
                                    <span style="font-size: 11px; color: var(--text-muted); background: var(--bg-tertiary); padding: 3px 8px; border-radius: 4px;">Link ${idx + 1}</span>
                                </div>
                            </div>
                            <button class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;" onclick="event.stopPropagation(); dashboard.deleteLink(${link.id})">Delete</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const form = document.getElementById('addLinkForm');
        const urlInput = document.getElementById('linkUrl');
        
        urlInput.addEventListener('change', () => {
            const status = document.getElementById('linkUrlStatus');
            try {
                new URL(urlInput.value);
                status.style.color = '#22c55e';
                status.textContent = '✓ Valid URL';
            } catch {
                status.style.color = '#ef4444';
                status.textContent = '✗ Invalid URL';
            }
        });
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addLink(
                document.getElementById('linkTitle').value,
                document.getElementById('linkUrl').value
            );
        });
        
        this.setupLinkDragDrop();
    }
    
    setupLinkDragDrop() {
        const links = document.querySelectorAll('[data-link-id]');
        let draggedElement = null;
        
        links.forEach(link => {
            link.addEventListener('dragstart', (e) => {
                draggedElement = link;
                link.style.opacity = '0.5';
            });
            
            link.addEventListener('dragend', () => {
                draggedElement = null;
                link.style.opacity = '1';
            });
            
            link.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (draggedElement && draggedElement !== link) {
                    const rect = link.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;
                    if (e.clientY < midpoint) {
                        link.parentNode.insertBefore(draggedElement, link);
                    } else {
                        link.parentNode.insertBefore(draggedElement, link.nextSibling);
                    }
                }
            });
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

        this.showModal('Edit Link', `
            <form id="editLinkForm">
                <div class="form-group">
                    <label class="form-label">Title</label>
                    <input type="text" class="form-input" id="editLinkTitle" value="${link.title}" required maxlength="50">
                    <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Up to 50 characters</p>
                </div>
                <div class="form-group">
                    <label class="form-label">URL</label>
                    <input type="url" class="form-input" id="editLinkUrl" value="${link.url}" required>
                    <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;" id="editUrlStatus"></p>
                </div>
            </form>
        `, async () => {
            const title = document.getElementById('editLinkTitle').value;
            const url = document.getElementById('editLinkUrl').value;

            if (!title.trim()) {
                this.showToast('Please enter a title', 'error');
                return false;
            }

            try {
                new URL(url);
            } catch {
                this.showToast('Invalid URL format', 'error');
                return false;
            }

            try {
                const response = await fetch(`/api/links/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ title, url })
                });

                if (response.ok) {
                    this.showToast('Link updated successfully', 'success');
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
        
        setTimeout(() => {
            const urlInput = document.getElementById('editLinkUrl');
            if (urlInput) {
                urlInput.addEventListener('change', () => {
                    const status = document.getElementById('editUrlStatus');
                    try {
                        new URL(urlInput.value);
                        status.style.color = '#22c55e';
                        status.textContent = '✓ Valid URL';
                    } catch {
                        status.style.color = '#ef4444';
                        status.textContent = '✗ Invalid URL';
                    }
                });
            }
        }, 100);
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
        const allFiles = await this.fetchFiles();
        const files = allFiles.filter(f => !f.is_temporary);
        
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
                    <p class="page-subtitle">Secure file storage with E2EE encryption - End-to-End Encrypted</p>
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
                <p style="color: var(--text-muted); margin-bottom: 16px;">Files up to 200 MB. AES-256-GCM encrypted end-to-end.</p>
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
                            <p class="card-description">Secure permanent E2EE encrypted file storage</p>
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="window.location.href='./faq'">View FAQ</button>
                </div>
                <div style="padding: 16px; color: var(--text-muted); line-height: 1.6;">
                    <p><strong style="color: #22c55e;">🔐 End-to-End Encrypted:</strong> All files are encrypted with AES-256-GCM before upload. Even we cannot access your files.</p>
                    <p style="margin-top: 12px;"><strong style="color: var(--text-primary);">Features:</strong> Permanent storage • Password protection • Expiration dates • Download tracking</p>
                    <p style="margin-top: 12px;"><strong style="color: var(--text-primary);">Forbidden types:</strong> .exe, .scr, .cpl, .doc*, .jar</p>
                </div>
            </div>
            
            <div style="margin-top: 32px;">
                <h3 style="margin-bottom: 16px;">Your Files (${files.length})</h3>
                ${files.length === 0 ? `
                    <div class="empty-state" style="text-align: center; padding: 48px 20px;">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                        <h3>No files uploaded</h3>
                        <p>Upload your first file to get started</p>
                    </div>
                ` : `
                    <div class="cards-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));" id="filesGrid">
                        ${files.map(file => {
                            const isImage = file.mime_type?.startsWith('image/');
                            const expiresAt = file.expires_at ? new Date(file.expires_at) : null;
                            const isExpired = expiresAt && expiresAt < new Date();
                            const expiryText = expiresAt ? expiresAt.toLocaleDateString() : 'Never';
                            const shareUrl = `${window.location.origin}/file/${file.code}`;
                            
                            return `
                                <div class="card" style="display: flex; flex-direction: column; padding: 16px; position: relative;">
                                    ${isExpired ? '<div style="position: absolute; top: 8px; right: 8px; background: #ef4444; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">EXPIRED</div>' : ''}
                                    
                                    <div style="width: 100%; height: 120px; background: var(--bg-tertiary); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; overflow: hidden; position: relative;">
                                        ${isImage ? 
                                            `<img data-file-code="${file.code}" alt="${file.filename}" style="width: 100%; height: 100%; object-fit: cover; display: none;">` :
                                            `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.6;">
                                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                                                <polyline points="13 2 13 9 20 9"></polyline>
                                            </svg>`
                                        }
                                        ${isImage ? `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.6; position: absolute;" class="placeholder-icon-${file.code}"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>` : ''}
                                    </div>
                                    
                                    <div style="flex: 1;">
                                        <h4 style="font-weight: 600; font-size: 14px; margin-bottom: 6px; word-break: break-word; color: var(--text-primary);">${file.filename}</h4>
                                        
                                        <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">
                                            <span style="font-size: 11px; color: var(--text-muted); background: var(--bg-tertiary); padding: 3px 8px; border-radius: 6px;">
                                                📦 ${this.formatFileSize(file.size)}
                                            </span>
                                            ${file.password_protected ? '<span style="font-size: 11px; color: #a855f7; background: rgba(168,85,247,0.15); padding: 3px 8px; border-radius: 6px;">🔒 Protected</span>' : ''}
                                            ${expiresAt ? `<span style="font-size: 11px; color: #f59e0b; background: rgba(245,158,11,0.15); padding: 3px 8px; border-radius: 6px;">⏱️ ${expiryText}</span>` : ''}
                                        </div>
                                        
                                        <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">
                                            <span style="margin-right: 12px;">👁️ Views: ${file.view_count || 0}</span>
                                            <span>⬇️ Downloads: ${file.download_count || 0}</span>
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex; gap: 8px; flex-direction: column;">
                                        <div style="display: flex; gap: 8px;">
                                            <button class="btn btn-secondary" onclick="dashboard.copyFileLink('${shareUrl}')" style="font-size: 12px; padding: 8px 12px; flex: 1;">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                </svg>
                                                Copy
                                            </button>
                                            <button class="btn btn-secondary" onclick="window.open('${shareUrl}', '_blank')" style="font-size: 12px; padding: 8px 12px; flex: 1;">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                                    <polyline points="15 3 21 3 21 9"></polyline>
                                                    <line x1="10" y1="14" x2="21" y2="3"></line>
                                                </svg>
                                                Open
                                            </button>
                                        </div>
                                        <button class="btn btn-danger" onclick="dashboard.deleteFile('${file.code}', 'files')" style="font-size: 12px; padding: 8px 12px;">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M3 6h18M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2l-1-14"></path>
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;

        this.setupFileUpload();
        this.loadImageThumbnails();
    }

    async loadImageThumbnails() {
        const imageElements = document.querySelectorAll('img[data-file-code]');
        for (const img of imageElements) {
            const fileCode = img.getAttribute('data-file-code');
            try {
                const response = await fetch(`/api/files/download/${fileCode}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({})
                });
                
                if (response.ok) {
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    img.src = url;
                    img.style.display = 'block';
                    const placeholder = document.querySelector(`.placeholder-icon-${fileCode}`);
                    if (placeholder) placeholder.style.display = 'none';
                }
            } catch (error) {
                console.error(`Failed to load thumbnail for ${fileCode}:`, error);
            }
        }
    }

    copyFileLink(url) {
        navigator.clipboard.writeText(url);
        this.showToast('📋 Download link copied to clipboard!', 'success');
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

    async deleteFile(code, section = 'files') {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            const response = await fetch(`/api/files/${code}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.showToast('File deleted', 'success');
                if (section === 'litterbox') {
                    this.renderLitterBox();
                } else {
                    this.renderFiles();
                }
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
        
        const allPlatforms = [
            { name: 'Patreon', icon: '🎉' },
            { name: 'YouTube', icon: '▶️' },
            { name: 'Discord', icon: '🎮' },
            { name: 'Slack', icon: '💬' },
            { name: 'Spotify', icon: '🎵' },
            { name: 'Instagram', icon: '📷' },
            { name: 'Twitter', icon: '𝕏' },
            { name: 'TikTok', icon: '🎬' },
            { name: 'Telegram', icon: '✈️' },
            { name: 'SoundCloud', icon: '☁️' },
            { name: 'PayPal', icon: '💳' },
            { name: 'GitHub', icon: '🐙' },
            { name: 'Cash App', icon: '💰' },
            { name: 'Mastodon', icon: '🐘' },
            { name: 'Twitch', icon: '📺' },
            { name: 'Kick', icon: '⚡' },
            { name: 'LinkedIn', icon: '💼' },
            { name: 'Email', icon: '📧' },
            { name: 'Website', icon: '🌐' }
        ];
        
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Social Connections</h1>
                    <p class="page-subtitle">Link your social media profiles to display on your bio</p>
                </div>
            </div>
            
            <div class="card" style="margin-bottom: 24px; padding: 24px;">
                <h2 style="margin-top: 0; margin-bottom: 16px; color: var(--text-primary);">New Socials</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 12px;">
                    ${allPlatforms.map(plat => `
                        <button class="social-icon-btn" style="padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-secondary); cursor: pointer; font-size: 28px; transition: all 0.2s; display: flex; align-items: center; justify-content: center;" title="${plat.name}" onclick="dashboard.showModal('Add ${plat.name}', '<form id=&quot;socialForm&quot;><div class=&quot;form-group&quot;><label class=&quot;form-label&quot;>${plat.name} URL</label><input type=&quot;url&quot; class=&quot;form-input&quot; id=&quot;socialUrl&quot; placeholder=&quot;https://...&quot; required></div></form>', () => { const url = document.getElementById(&quot;socialUrl&quot;).value; if(url.trim()) { dashboard.showToast(&quot;${plat.name} connected&quot;, &quot;success&quot;); dashboard.renderConnections(); return true; } return false; })">
                            ${plat.icon}
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <div class="card" style="padding: 24px;">
                <h2 style="margin-top: 0; margin-bottom: 16px; color: var(--text-primary);">Existing Socials</h2>
                ${connections.length === 0 ? `
                    <div style="text-align: center; padding: 32px 20px; color: var(--text-muted);">
                        <p>No social connections yet. Add one above to get started.</p>
                    </div>
                ` : `
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${connections.map(conn => `
                            <div style="display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; padding: 12px; background: var(--bg-secondary); border-radius: 6px; border: 1px solid var(--border-color);">
                                <div style="min-width: 0;">
                                    <h4 style="margin: 0 0 4px 0; color: var(--text-primary);">${conn.platform}</h4>
                                    <p style="margin: 0; font-size: 12px; color: var(--text-muted); word-break: break-all;">${conn.username}</p>
                                </div>
                                <button class="btn btn-danger" style="padding: 6px 12px; font-size: 12px; white-space: nowrap;" onclick="dashboard.disconnectPlatform('${conn.platform}')">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; display: inline;">
                                        <polyline points="3 6 5 4 21 4 23 6 23 20a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V6z"></polyline>
                                        <line x1="10" y1="11" x2="10" y2="17"></line>
                                        <line x1="14" y1="11" x2="14" y2="17"></line>
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}
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
        const allFiles = await this.fetchFiles();
        const litterboxFiles = allFiles.filter(f => f.is_temporary);
        
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
                    <p class="page-subtitle">Temporary E2EE encrypted file hosting - Auto-delete after expiry</p>
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
                        <h3 class="card-title">Upload Temporary File</h3>
                        <p class="card-description">Up to 1GB with automatic expiration (1h, 12h, 1d, 3d)</p>
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
            
            <div style="margin-top: 32px;">
                <h3 style="margin-bottom: 16px;">Your Temporary Files (${litterboxFiles.length})</h3>
                ${litterboxFiles.length === 0 ? `
                    <div class="empty-state" style="text-align: center; padding: 48px 20px;">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                            <polyline points="13 2 13 9 20 9"></polyline>
                        </svg>
                        <h3>No temporary files</h3>
                        <p>Upload your first temporary file to get started</p>
                    </div>
                ` : `
                    <div class="cards-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));" id="litterboxFilesGrid">
                        ${litterboxFiles.map(file => {
                            const isImage = file.mime_type?.startsWith('image/');
                            const expiresAt = file.expires_at ? new Date(file.expires_at) : null;
                            const isExpired = expiresAt && expiresAt < new Date();
                            const expiryText = expiresAt ? expiresAt.toLocaleDateString() + ' ' + expiresAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A';
                            const shareUrl = window.location.origin + '/file/' + file.code;
                            const createdAt = file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown';
                            const imgPreview = isImage ? '<img data-file-code="' + file.code + '" alt="' + file.filename + '" style="width: 100%; height: 100%; object-fit: cover; display: none;">' : '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.6;"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>';
                            const placeholderIcon = isImage ? '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.6; position: absolute;" class="placeholder-icon-' + file.code + '"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>' : '';
                            
                            return '<div class="card" style="display: flex; flex-direction: column; padding: 16px; position: relative;">' + 
                                (isExpired ? '<div style="position: absolute; top: 8px; right: 8px; background: #ef4444; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600;">EXPIRED</div>' : '') +
                                '<div style="width: 100%; height: 120px; background: var(--bg-tertiary); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; overflow: hidden; position: relative;">' +
                                imgPreview +
                                placeholderIcon +
                                '</div><div style="flex: 1;"><h4 style="font-weight: 600; font-size: 14px; margin-bottom: 6px; word-break: break-word; color: var(--text-primary);">' + file.filename + '</h4>' +
                                '<div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px;">' +
                                '<span style="font-size: 11px; color: var(--text-muted); background: var(--bg-tertiary); padding: 3px 8px; border-radius: 6px;">📦 ' + this.formatFileSize(file.size) + '</span>' +
                                (file.password_protected ? '<span style="font-size: 11px; color: #a855f7; background: rgba(168,85,247,0.15); padding: 3px 8px; border-radius: 6px;">🔒 Protected</span>' : '') +
                                '<span style="font-size: 11px; color: #f59e0b; background: rgba(245,158,11,0.15); padding: 3px 8px; border-radius: 6px;">⏱️ ' + expiryText + '</span></div>' +
                                '<div style="font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">' +
                                '<span style="margin-right: 12px;">📅 Uploaded: ' + createdAt + '</span><br>' +
                                '<span style="margin-right: 12px;">👁️ Views: ' + (file.view_count || 0) + '</span>' +
                                '<span>⬇️ Downloads: ' + (file.download_count || 0) + '</span></div></div>' +
                                '<div style="display: flex; gap: 8px; flex-direction: column;">' +
                                '<div style="display: flex; gap: 8px;">' +
                                '<button class="btn btn-secondary" onclick="dashboard.copyFileLink(\'' + shareUrl + '\')" style="font-size: 12px; padding: 8px 12px; flex: 1;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>Copy</button>' +
                                '<button class="btn btn-secondary" onclick="window.open(\'' + shareUrl + '\', \'_blank\')" style="font-size: 12px; padding: 8px 12px; flex: 1;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>Open</button></div>' +
                                '<button class="btn btn-danger" onclick="dashboard.deleteFile(\'' + file.code + '\', \'litterbox\')" style="font-size: 12px; padding: 8px 12px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2l-1-14"></path></svg>Delete</button></div></div>';
                        }).join('')}
                    </div>
                `}
            </div>
            
            <div class="card" style="margin-top: 32px;">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="card-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                        </div>
                        <div>
                            <h3 class="card-title">About LitterBox</h3>
                            <p class="card-description">Temporary E2EE encrypted file hosting</p>
                        </div>
                    </div>
                    <button class="btn btn-secondary" onclick="window.location.href='./lbfaq'">View FAQ</button>
                </div>
                <div style="padding: 16px; color: var(--text-muted); line-height: 1.6;">
                    <p><strong style="color: #22c55e;">🔐 End-to-End Encrypted:</strong> All files are encrypted with AES-256-GCM before upload. Auto-deleted after expiration.</p>
                    <p style="margin-top: 12px;"><strong style="color: var(--text-primary);">Features:</strong> Up to 1GB • Auto-delete (1h-3d) • Password protected • View & download tracking</p>
                    <p style="margin-top: 12px;"><strong style="color: var(--text-primary);">Forbidden types:</strong> .exe, .scr, .cpl, .doc*, .jar</p>
                </div>
            </div>
        `;

        this.setupLitterBoxUpload();
        this.loadImageThumbnails();
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
                const response = await fetch('/api/files/litterbox', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    this.showToast(selectedFile.name + ' uploaded', 'success');
                    form.reset();
                    selectedFile = null;
                    document.getElementById('selectedFileInfo').style.display = 'none';
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Upload Temporary File';
                    await this.renderLitterBox();
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
            
            <div class="card" style="border: 1px dashed rgba(160, 160, 176, 0.4); padding: 20px;">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                    <div style="width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <polyline points="16 18 22 12 16 6"></polyline>
                            <polyline points="8 6 2 12 8 18"></polyline>
                        </svg>
                    </div>
                    <h3 style="margin-bottom: 0;">API Endpoints</h3>
                    <span style="margin-left: auto; font-size: 12px; background: rgba(168, 85, 247, 0.15); color: #a855f7; padding: 4px 8px; border-radius: 4px;">SOON</span>
                </div>
                <p style="color: var(--text-muted); margin-bottom: 0;">Coming soon. API documentation and integration guides will be available here.</p>
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
