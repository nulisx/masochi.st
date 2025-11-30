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
        const contentArea = document.getElementById('contentArea');
        
        try {
            const response = await fetch('/api/biolinks', { credentials: 'include' });
            if (!response.ok) throw new Error('Failed to load biolinks settings');
            
            const data = await response.json();
            const settings = data.settings || {};
            
            contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Bio Customize</h1>
                    <p class="page-subtitle">Customize your biolink appearance</p>
                </div>
                <button class="btn btn-primary" id="saveBiolinksBtn" style="margin-left: auto;">Save changes</button>
            </div>
            
            <div class="biolinks-tabs">
                <button class="biolinks-tab-btn active" data-tab="general">General</button>
                <button class="biolinks-tab-btn" data-tab="background">Background</button>
                <button class="biolinks-tab-btn" data-tab="profile">Profile</button>
                <button class="biolinks-tab-btn" data-tab="link">Link</button>
                <button class="biolinks-tab-btn" data-tab="badge">Badge</button>
                <button class="biolinks-tab-btn" data-tab="layout">Layout</button>
                <button class="biolinks-tab-btn" data-tab="effects">Effects</button>
                <button class="biolinks-tab-btn" data-tab="embed">Embed</button>
                <button class="biolinks-tab-btn" data-tab="config">Config</button>
            </div>
            
            <form id="biolinksForm" class="biolinks-form">
                <!-- General Tab -->
                <div class="biolinks-tab-content active" id="tab-general">
                    <div class="form-group">
                        <label class="form-label">Layout</label>
                        <select class="form-input" name="layout">
                            <option value="modern" ${settings.layout === 'modern' ? 'selected' : ''}>Modern</option>
                            <option value="classic" ${settings.layout === 'classic' ? 'selected' : ''}>Classic</option>
                            <option value="minimal" ${settings.layout === 'minimal' ? 'selected' : ''}>Minimal</option>
                        </select>
                    </div>
                </div>
                
                <!-- Background Tab -->
                <div class="biolinks-tab-content" id="tab-background">
                    <div class="form-group">
                        <label class="form-label">Background Effects</label>
                        <select class="form-input" name="bg_effects">
                            <option value="none" ${settings.bg_effects === 'none' ? 'selected' : ''}>None</option>
                            <option value="snow" ${settings.bg_effects === 'snow' ? 'selected' : ''}>Snow Animated</option>
                            <option value="particles" ${settings.bg_effects === 'particles' ? 'selected' : ''}>Particles</option>
                            <option value="waves" ${settings.bg_effects === 'waves' ? 'selected' : ''}>Waves</option>
                            <option value="tv" ${settings.bg_effects === 'tv' ? 'selected' : ''}>TV</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Background Color</label>
                        <input type="color" class="form-input" name="bg_effects_color" value="${settings.bg_effects_color || '#1a1a1c'}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Background Opacity: <span id="bgOpacityValue">${settings.bg_effects_opacity || 100}%</span></label>
                        <input type="range" class="form-input" name="bg_effects_opacity" min="0" max="100" value="${settings.bg_effects_opacity || 100}" oninput="document.getElementById('bgOpacityValue').textContent = this.value + '%'">
                    </div>
                </div>
                
                <!-- Profile Tab -->
                <div class="biolinks-tab-content" id="tab-profile">
                    <div class="form-group">
                        <label class="form-label">Profile Text Color</label>
                        <input type="color" class="form-input" name="profile_text_color" value="${settings.profile_text_color || '#dededd'}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Avatar Border</label>
                        <label class="toggle-switch">
                            <input type="checkbox" name="profile_avatar_border" ${settings.profile_avatar_border ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Avatar Border Color</label>
                        <input type="color" class="form-input" name="profile_avatar_border_color" value="${settings.profile_avatar_border_color || '#000000'}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Avatar Border Width: <span id="avatarBorderValue">${settings.profile_avatar_border_width || 2}px</span></label>
                        <input type="range" class="form-input" name="profile_avatar_border_width" min="0" max="20" value="${settings.profile_avatar_border_width || 2}" oninput="document.getElementById('avatarBorderValue').textContent = this.value + 'px'">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Profile Background Color</label>
                        <input type="color" class="form-input" name="profile_bg_color" value="${settings.profile_bg_color || '#0a0a0a'}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Profile BG Opacity: <span id="profileBgOpacityValue">${settings.profile_bg_opacity || 100}%</span></label>
                        <input type="range" class="form-input" name="profile_bg_opacity" min="0" max="100" value="${settings.profile_bg_opacity || 100}" oninput="document.getElementById('profileBgOpacityValue').textContent = this.value + '%'">
                    </div>
                </div>
                
                <!-- Link Tab -->
                <div class="biolinks-tab-content" id="tab-link">
                    <div class="form-group">
                        <label class="form-label">Link Border</label>
                        <label class="toggle-switch">
                            <input type="checkbox" name="link_border" ${settings.link_border ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Link Border Radius: <span id="linkRadiusValue">${settings.link_border_radius || 50}px</span></label>
                        <input type="range" class="form-input" name="link_border_radius" min="0" max="100" value="${settings.link_border_radius || 50}" oninput="document.getElementById('linkRadiusValue').textContent = this.value + 'px'">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Link Text Color</label>
                        <input type="color" class="form-input" name="link_text_color" value="${settings.link_text_color || '#6e3e3e'}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Link Icon Color</label>
                        <input type="color" class="form-input" name="link_icon_color" value="${settings.link_icon_color || '#f6f5f4'}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Link Icon Background</label>
                        <input type="color" class="form-input" name="link_icon_bg_color" value="${settings.link_icon_bg_color || '#1e1e1e'}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Link Icon Opacity: <span id="linkIconOpacityValue">${settings.link_icon_opacity || 100}%</span></label>
                        <input type="range" class="form-input" name="link_icon_opacity" min="0" max="100" value="${settings.link_icon_opacity || 100}" oninput="document.getElementById('linkIconOpacityValue').textContent = this.value + '%'">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Link Icon Glow</label>
                        <label class="toggle-switch">
                            <input type="checkbox" name="link_icon_glow" ${settings.link_icon_glow ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Link Icon Glow Size: <span id="linkGlowSizeValue">${settings.link_icon_glow_size || 0}px</span></label>
                        <input type="range" class="form-input" name="link_icon_glow_size" min="0" max="50" value="${settings.link_icon_glow_size || 0}" oninput="document.getElementById('linkGlowSizeValue').textContent = this.value + 'px'">
                    </div>
                </div>
                
                <!-- Badge Tab -->
                <div class="biolinks-tab-content" id="tab-badge">
                    <div class="form-group">
                        <label class="form-label">Show Badge</label>
                        <label class="toggle-switch">
                            <input type="checkbox" name="badge_show_hide" ${settings.badge_show_hide ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Badge Border</label>
                        <label class="toggle-switch">
                            <input type="checkbox" name="badge_border" ${settings.badge_border ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Badge Border Radius: <span id="badgeRadiusValue">${settings.badge_border_radius || 50}px</span></label>
                        <input type="range" class="form-input" name="badge_border_radius" min="0" max="100" value="${settings.badge_border_radius || 50}" oninput="document.getElementById('badgeRadiusValue').textContent = this.value + 'px'">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Badge Text Color</label>
                        <input type="color" class="form-input" name="badge_text_color" value="${settings.badge_text_color || '#000000'}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Badge Icon Color</label>
                        <input type="color" class="form-input" name="badge_icon_color" value="${settings.badge_icon_color || '#f6f5f4'}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Badge Icon Opacity: <span id="badgeIconOpacityValue">${settings.badge_icon_opacity || 100}%</span></label>
                        <input type="range" class="form-input" name="badge_icon_opacity" min="0" max="100" value="${settings.badge_icon_opacity || 100}" oninput="document.getElementById('badgeIconOpacityValue').textContent = this.value + '%'">
                    </div>
                </div>
                
                <!-- Layout Tab -->
                <div class="biolinks-tab-content" id="tab-layout">
                    <div class="form-group">
                        <label class="form-label">Link Spacing: <span id="linkSpacingValue">${settings.layout_link_spacing || 12}px</span></label>
                        <input type="range" class="form-input" name="layout_link_spacing" min="0" max="50" value="${settings.layout_link_spacing || 12}" oninput="document.getElementById('linkSpacingValue').textContent = this.value + 'px'">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Link Alignment</label>
                        <select class="form-input" name="layout_link_alignment">
                            <option value="center" ${settings.layout_link_alignment === 'center' ? 'selected' : ''}>Center</option>
                            <option value="left" ${settings.layout_link_alignment === 'left' ? 'selected' : ''}>Left</option>
                            <option value="right" ${settings.layout_link_alignment === 'right' ? 'selected' : ''}>Right</option>
                            <option value="stretch" ${settings.layout_link_alignment === 'stretch' ? 'selected' : ''}>Stretch</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Link Width: <span id="linkWidthValue">${settings.layout_link_width || 100}%</span></label>
                        <input type="range" class="form-input" name="layout_link_width" min="50" max="100" value="${settings.layout_link_width || 100}" oninput="document.getElementById('linkWidthValue').textContent = this.value + '%'">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Link Padding: <span id="linkPaddingValue">${settings.layout_link_padding || 16}px</span></label>
                        <input type="range" class="form-input" name="layout_link_padding" min="0" max="32" value="${settings.layout_link_padding || 16}" oninput="document.getElementById('linkPaddingValue').textContent = this.value + 'px'">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Profile Spacing: <span id="profileSpacingValue">${settings.layout_profile_spacing || 24}px</span></label>
                        <input type="range" class="form-input" name="layout_profile_spacing" min="0" max="100" value="${settings.layout_profile_spacing || 24}" oninput="document.getElementById('profileSpacingValue').textContent = this.value + 'px'">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Show Grid</label>
                        <label class="toggle-switch">
                            <input type="checkbox" name="layout_show_grid" ${settings.layout_show_grid ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <!-- Effects Tab -->
                <div class="biolinks-tab-content" id="tab-effects">
                    <div class="form-group">
                        <label class="form-label">Nickname Effects</label>
                        <select class="form-input" name="effects_nickname_effects">
                            <option value="none" ${settings.effects_nickname_effects === 'none' ? 'selected' : ''}>None</option>
                            <option value="rainbow" ${settings.effects_nickname_effects === 'rainbow' ? 'selected' : ''}>Rainbow</option>
                            <option value="glow" ${settings.effects_nickname_effects === 'glow' ? 'selected' : ''}>Glow</option>
                            <option value="pulse" ${settings.effects_nickname_effects === 'pulse' ? 'selected' : ''}>Pulse</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Description Effects</label>
                        <select class="form-input" name="effects_description_effects">
                            <option value="none" ${settings.effects_description_effects === 'none' ? 'selected' : ''}>None</option>
                            <option value="fade" ${settings.effects_description_effects === 'fade' ? 'selected' : ''}>Fade</option>
                            <option value="slide" ${settings.effects_description_effects === 'slide' ? 'selected' : ''}>Slide</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Username Glow</label>
                        <label class="toggle-switch">
                            <input type="checkbox" name="effects_username_glow" ${settings.effects_username_glow ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Username Glow Size: <span id="usernameGlowValue">${settings.effects_username_glow_size || 0}px</span></label>
                        <input type="range" class="form-input" name="effects_username_glow_size" min="0" max="50" value="${settings.effects_username_glow_size || 0}" oninput="document.getElementById('usernameGlowValue').textContent = this.value + 'px'">
                    </div>
                </div>
                
                <!-- Embed Tab -->
                <div class="biolinks-tab-content" id="tab-embed">
                    <div class="form-group">
                        <label class="form-label">Enable Embed Code</label>
                        <label class="toggle-switch">
                            <input type="checkbox" name="embed_enable_code" ${settings.embed_enable_code ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Embed Width: <span id="embedWidthValue">${settings.embed_width || 100}%</span></label>
                        <input type="range" class="form-input" name="embed_width" min="50" max="100" value="${settings.embed_width || 100}" oninput="document.getElementById('embedWidthValue').textContent = this.value + '%'">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Embed Height: <span id="embedHeightValue">${settings.embed_height || 600}px</span></label>
                        <input type="range" class="form-input" name="embed_height" min="300" max="1200" value="${settings.embed_height || 600}" oninput="document.getElementById('embedHeightValue').textContent = this.value + 'px'">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Embed Border</label>
                        <label class="toggle-switch">
                            <input type="checkbox" name="embed_show_border" ${settings.embed_show_border ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Embed Border Color</label>
                        <input type="color" class="form-input" name="embed_border_color" value="${settings.embed_border_color || '#9333ea'}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Embed Border Radius: <span id="embedRadiusValue">${settings.embed_border_radius || 12}px</span></label>
                        <input type="range" class="form-input" name="embed_border_radius" min="0" max="50" value="${settings.embed_border_radius || 12}" oninput="document.getElementById('embedRadiusValue').textContent = this.value + 'px'">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Enable Scrolling</label>
                        <label class="toggle-switch">
                            <input type="checkbox" name="embed_scrollable" ${settings.embed_scrollable ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="form-group" style="padding: 16px; background: var(--bg-tertiary); border-radius: 8px; margin-top: 16px;">
                        <h3 style="margin-bottom: 12px;">Embed Code</h3>
                        <textarea id="embedCode" readonly style="width: 100%; height: 100px; padding: 8px; background: var(--bg-secondary); border: 1px solid rgba(168,85,247,0.2); border-radius: 4px; color: var(--text-primary); font-family: monospace; font-size: 12px; resize: none;"></textarea>
                        <button type="button" class="btn btn-secondary" style="margin-top: 8px;" onclick="dashboard.copyEmbedCode()">Copy Code</button>
                    </div>
                </div>
                
                <!-- Config Tab -->
                <div class="biolinks-tab-content" id="tab-config">
                    <div class="form-group" style="padding: 16px; background: var(--bg-tertiary); border-radius: 8px;">
                        <h3 style="margin-bottom: 12px;">Import Settings</h3>
                        <input type="file" id="importSettings" accept=".json" style="margin-bottom: 12px;">
                        <button type="button" class="btn btn-secondary" onclick="dashboard.importBiolinkSettings()">Import</button>
                    </div>
                    <div class="form-group" style="padding: 16px; background: var(--bg-tertiary); border-radius: 8px; margin-top: 16px;">
                        <h3 style="margin-bottom: 12px;">Export Settings</h3>
                        <button type="button" class="btn btn-secondary" onclick="dashboard.exportBiolinkSettings()">Download Settings</button>
                    </div>
                </div>
            </form>
        `;
            
            this.setupBiolinksInterface(settings);
        } catch (error) {
            console.error('Error loading biolinks:', error);
            contentArea.innerHTML = `
                <div class="page-header">
                    <button class="page-back" onclick="dashboard.loadPage('overview')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <div>
                        <h1 class="page-title">Bio Customize</h1>
                    </div>
                </div>
                <div class="card" style="margin-top: 24px; padding: 32px; text-align: center;">
                    <p style="color: #ef4444; margin-bottom: 16px;">Error loading biolinks settings</p>
                    <p style="color: var(--text-muted); margin-bottom: 16px;">${error.message}</p>
                    <button class="btn btn-primary" onclick="dashboard.renderBiolinks()">Retry</button>
                </div>
            `;
        }
    }

    setupBiolinksInterface(settings) {
        const tabButtons = document.querySelectorAll('.biolinks-tab-btn');
        const tabContents = document.querySelectorAll('.biolinks-tab-content');
        const form = document.getElementById('biolinksForm');
        const saveBtn = document.getElementById('saveBiolinksBtn');
        
        // Generate embed code
        this.generateEmbedCode(settings);
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
            });
        });
        
        saveBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = {};
            for (let [key, value] of formData.entries()) {
                if (value === 'on') data[key] = true;
                else if (value === '') data[key] = false;
                else data[key] = value;
            }
            
            try {
                const response = await fetch('/api/biolinks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    this.showToast('Biolink settings saved successfully', 'success');
                    saveBtn.style.opacity = '0.5';
                    setTimeout(() => { saveBtn.style.opacity = '1'; }, 1000);
                } else {
                    this.showToast('Failed to save settings', 'error');
                }
            } catch (error) {
                this.showToast('Error saving settings', 'error');
            }
        });
    }
    
    exportBiolinkSettings() {
        fetch('/api/biolinks', { credentials: 'include' })
            .then(r => r.json())
            .then(({ settings }) => {
                const json = JSON.stringify(settings, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'biolink-settings.json';
                a.click();
                URL.revokeObjectURL(url);
            });
    }
    
    importBiolinkSettings() {
        const file = document.getElementById('importSettings').files[0];
        if (!file) return this.showToast('Please select a file', 'error');
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                const response = await fetch('/api/biolinks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(settings)
                });
                if (response.ok) {
                    this.showToast('Settings imported successfully', 'success');
                    this.renderBiolinks();
                } else {
                    this.showToast('Failed to import settings', 'error');
                }
            } catch (err) {
                this.showToast('Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    generateEmbedCode(settings) {
        const embedWidth = settings.embed_width || 100;
        const embedHeight = settings.embed_height || 600;
        const username = this.user?.username || 'username';
        const scrollable = settings.embed_scrollable ? 'yes' : 'no';
        
        const embedCode = `<iframe 
  src="https://glowi.es/@${username}" 
  width="${embedWidth}%" 
  height="${embedHeight}px" 
  frameborder="${settings.embed_show_border ? '1' : '0'}" 
  scrolling="${scrollable}" 
  style="border-radius: ${settings.embed_border_radius || 12}px; border: ${settings.embed_show_border ? `1px solid ${settings.embed_border_color || '#9333ea'}` : 'none'};"></iframe>`;
        
        const codeArea = document.getElementById('embedCode');
        if (codeArea) {
            codeArea.textContent = embedCode;
        }
    }

    copyEmbedCode() {
        const codeArea = document.getElementById('embedCode');
        if (!codeArea) return this.showToast('Embed code not found', 'error');
        
        codeArea.select();
        document.execCommand('copy');
        this.showToast('Embed code copied to clipboard', 'success');
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

    getSocialPlatforms() {
        return [
            { 
                name: 'Snapchat', 
                prefix: 'snapchat.com/add/', 
                color: '#FFFC00', 
                modalTitle: 'Snapchat Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#FFFC00"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.03-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"/></svg>`
            },
            { 
                name: 'YouTube', 
                prefix: 'youtube.com/', 
                color: '#FF0000', 
                modalTitle: 'Youtube Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`
            },
            { 
                name: 'Discord', 
                prefix: 'discord.com/users/', 
                color: '#5865F2', 
                modalTitle: 'Discord User ID',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#5865F2"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>`
            },
            { 
                name: 'Discord Server', 
                prefix: 'discord.gg/', 
                color: '#5865F2', 
                modalTitle: 'Discord Server Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#5865F2"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>`
            },
            { 
                name: 'Spotify', 
                prefix: 'open.spotify.com/', 
                color: '#1DB954', 
                modalTitle: 'Spotify Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>`
            },
            { 
                name: 'Instagram', 
                prefix: 'instagram.com/', 
                color: '#E4405F', 
                modalTitle: 'Instagram Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#E4405F"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>`
            },
            { 
                name: 'Twitter', 
                prefix: 'x.com/', 
                color: '#1DA1F2', 
                modalTitle: 'Twitter Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#1DA1F2"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>`
            },
            { 
                name: 'TikTok', 
                prefix: 'tiktok.com/@', 
                color: '#000000', 
                modalTitle: 'Tiktok Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#ffffff"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>`
            },
            { 
                name: 'Telegram', 
                prefix: 't.me/', 
                color: '#0088cc', 
                modalTitle: 'Telegram Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#0088cc"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`
            },
            { 
                name: 'SoundCloud', 
                prefix: 'soundcloud.com/', 
                color: '#FF5500', 
                modalTitle: 'Soundcloud Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#FF5500"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899 1.108c-.053 0-.098.04-.104.104l-.177 1.046.177 1.022c.006.058.051.098.104.098.05 0 .095-.04.103-.098l.202-1.022-.202-1.046c-.008-.058-.053-.104-.103-.104zm1.795-.883c-.053 0-.095.04-.103.098l-.227 1.927.227 1.877c.008.058.05.098.103.098.053 0 .095-.04.103-.098l.255-1.877-.255-1.927c-.008-.052-.05-.098-.103-.098zm.897-.312c-.053 0-.095.04-.103.098l-.227 2.239.227 2.127c.008.058.05.098.103.098.052 0 .095-.04.103-.098l.255-2.127-.255-2.239c-.008-.058-.05-.098-.103-.098zm.897-.375c-.053 0-.095.04-.103.098l-.227 2.614.227 2.378c.008.058.05.098.103.098.052 0 .095-.04.103-.098l.255-2.378-.255-2.614c-.008-.058-.05-.098-.103-.098zm.897-.375c-.053 0-.095.04-.103.098l-.227 2.989.227 2.558c.008.058.05.098.103.098.052 0 .095-.04.103-.098l.255-2.558-.255-2.989c-.008-.058-.05-.098-.103-.098zm1.025-.478c-.061 0-.112.046-.118.104l-.193 3.467.193 2.582c.006.058.057.104.118.104.061 0 .112-.046.118-.104l.217-2.582-.217-3.467c-.006-.058-.057-.104-.118-.104zm.897-.146c-.061 0-.112.046-.118.104l-.193 3.613.193 2.582c.006.058.057.104.118.104.061 0 .112-.046.118-.104l.217-2.582-.217-3.613c-.006-.058-.057-.104-.118-.104zm.897-.146c-.061 0-.112.046-.118.104l-.193 3.759.193 2.582c.006.058.057.104.118.104.061 0 .112-.046.118-.104l.217-2.582-.217-3.759c-.006-.058-.057-.104-.118-.104zm.897-.146c-.061 0-.112.046-.118.104l-.193 3.905.193 2.582c.006.058.057.104.118.104.061 0 .112-.046.118-.104l.217-2.582-.217-3.905c-.006-.058-.057-.104-.118-.104zm.897.208c-.061 0-.112.046-.118.104l-.193 3.697.193 2.582c.006.058.057.104.118.104.061 0 .112-.046.118-.104l.217-2.582-.217-3.697c-.006-.058-.057-.104-.118-.104zm.897-.854c-.061 0-.112.046-.118.104l-.193 4.551.193 2.547c.006.058.057.104.118.104.061 0 .112-.046.118-.104l.217-2.547-.217-4.551c-.006-.058-.057-.104-.118-.104zm1.025.146c-.069 0-.125.052-.131.117l-.172 4.405.172 2.505c.006.065.062.117.131.117.069 0 .125-.052.131-.117l.193-2.505-.193-4.405c-.006-.065-.062-.117-.131-.117zm.897-.146c-.069 0-.125.052-.131.117l-.172 4.551.172 2.505c.006.065.062.117.131.117.069 0 .125-.052.131-.117l.193-2.505-.193-4.551c-.006-.065-.062-.117-.131-.117zm.897-.354c-.069 0-.125.052-.131.117l-.172 4.905.172 2.463c.006.065.062.117.131.117.069 0 .125-.052.131-.117l.193-2.463-.193-4.905c-.006-.065-.062-.117-.131-.117zm1.025.5c-.076 0-.138.058-.145.131l-.151 4.405.151 2.42c.007.073.069.131.145.131.076 0 .138-.058.145-.131l.172-2.42-.172-4.405c-.007-.073-.069-.131-.145-.131zm.922-.583c-.076 0-.138.058-.145.131l-.151 4.988.151 2.378c.007.073.069.131.145.131.076 0 .138-.058.145-.131l.172-2.378-.172-4.988c-.007-.073-.069-.131-.145-.131zm.897-.271c-.076 0-.138.058-.145.131l-.151 5.259.151 2.336c.007.073.069.131.145.131.076 0 .138-.058.145-.131l.172-2.336-.172-5.259c-.007-.073-.069-.131-.145-.131zm1.025.708c-.084 0-.151.065-.158.145l-.13 4.551.13 2.294c.007.08.074.145.158.145.084 0 .151-.065.158-.145l.151-2.294-.151-4.551c-.007-.08-.074-.145-.158-.145zm.897-1.062c-.084 0-.151.065-.158.145l-.13 5.613.13 2.252c.007.08.074.145.158.145.084 0 .151-.065.158-.145l.151-2.252-.151-5.613c-.007-.08-.074-.145-.158-.145zm1.922 5.488c-.042-.474-.142-.936-.296-1.373-.154-.436-.361-.851-.617-1.232a4.478 4.478 0 00-.893-1.023c-.338-.296-.719-.54-1.129-.723-.41-.182-.852-.303-1.31-.362-.108-.015-.218-.022-.328-.022-.423 0-.834.071-1.22.203v7.581c.008.085.072.151.158.158h6.043c.585 0 1.131-.228 1.543-.64.412-.412.64-.958.64-1.543 0-.585-.228-1.131-.64-1.543-.412-.412-.958-.64-1.543-.64-.204 0-.403.028-.592.081z"/></svg>`
            },
            { 
                name: 'PayPal', 
                prefix: 'paypal.me/', 
                color: '#003087', 
                modalTitle: 'Paypal Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#003087"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/></svg>`
            },
            { 
                name: 'GitHub', 
                prefix: 'github.com/', 
                color: '#ffffff', 
                modalTitle: 'Github Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#ffffff"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`
            },
            { 
                name: 'CashApp', 
                prefix: 'cash.app/$', 
                color: '#00D632', 
                modalTitle: 'Cashapp Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#00D632"><path d="M23.59 3.47A5.1 5.1 0 0 0 20.54.42C19.23 0 18.04 0 15.66 0H8.34C5.96 0 4.77 0 3.46.42A5.1 5.1 0 0 0 .41 3.47C0 4.78 0 5.96 0 8.34v7.32c0 2.38 0 3.56.42 4.87a5.1 5.1 0 0 0 3.05 3.05c1.31.42 2.5.42 4.87.42h7.32c2.38 0 3.56 0 4.87-.42a5.1 5.1 0 0 0 3.05-3.05c.42-1.31.42-2.5.42-4.87V8.34c0-2.38 0-3.56-.42-4.87zM17.7 13.28c-.14.45-.76.87-1.57 1.02-.38.07-.77.1-1.16.1-.53 0-1.06-.06-1.57-.18a6.9 6.9 0 0 1-1.57-.53l.58-1.7a5.27 5.27 0 0 0 2.56.68c.65 0 1.09-.17 1.09-.55 0-.36-.44-.52-1.09-.7l-.35-.1c-1.21-.35-2.19-.83-2.19-2.06 0-1.29 1.08-2.26 2.87-2.45V5.6h1.05v1.17c.98.1 1.72.37 2.17.66l-.6 1.64a4.36 4.36 0 0 0-2.05-.55c-.7 0-.99.23-.99.52 0 .32.4.47 1.16.7l.35.1c1.43.42 2.13 1.01 2.13 2.15 0 1.26-1.01 2.17-2.74 2.45v1.21h-1.05v-1.17c-.01-.01-.02-.03-.03-.2z"/></svg>`
            },
            { 
                name: 'Brave', 
                prefix: '', 
                color: '#FB542B', 
                modalTitle: 'Brave Wallet',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#FB542B"><path d="M12 0L2.524 4.455l1.186 15.39L12 24l8.29-4.155 1.186-15.39L12 0zm7.098 13.795l-.984 4.188c-.098.42-.492.743-.924.743H6.81c-.432 0-.826-.322-.924-.743l-.984-4.188c-.098-.42.148-.842.555-.96l5.987-1.8c.174-.052.358-.052.532 0l5.987 1.8c.407.118.653.54.555.96h-.42zm-1.31-5.953l-5.194 1.558a1.06 1.06 0 01-.588 0l-5.194-1.558c-.432-.13-.615-.63-.37-.99l2.05-3.004c.123-.18.32-.288.532-.288h5.552c.212 0 .41.108.532.287l2.05 3.005c.246.36.062.86-.37.99z"/></svg>`
            },
            { 
                name: 'Twitch', 
                prefix: 'twitch.tv/', 
                color: '#9146FF', 
                modalTitle: 'Twitch Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#9146FF"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>`
            },
            { 
                name: 'Kick', 
                prefix: 'kick.com/', 
                color: '#53FC18', 
                modalTitle: 'Kick Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#53FC18"><path d="M1.333 0h21.334C23.403 0 24 .597 24 1.333v21.334c0 .736-.597 1.333-1.333 1.333H1.333C.597 24 0 23.403 0 22.667V1.333C0 .597.597 0 1.333 0zm5.334 5.333H4v13.334h2.667V12.89l1.777-1.778 3.556 7.556h2.667v-.001l-4.445-9.778L14.667 4.443h-2.89L8 8.223V5.333h-1.333z"/></svg>`
            },
            { 
                name: 'Reddit', 
                prefix: 'reddit.com/u/', 
                color: '#FF4500', 
                modalTitle: 'Reddit Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#FF4500"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>`
            },
            { 
                name: 'LinkedIn', 
                prefix: 'linkedin.com/in/', 
                color: '#0A66C2', 
                modalTitle: 'Linkedin Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`
            },
            { 
                name: 'Pinterest', 
                prefix: 'pinterest.com/', 
                color: '#E60023', 
                modalTitle: 'Pinterest Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#E60023"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>`
            },
            { 
                name: 'Facebook', 
                prefix: 'facebook.com/', 
                color: '#1877F2', 
                modalTitle: 'Facebook Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
            },
            { 
                name: 'BTC', 
                prefix: '', 
                color: '#F7931A', 
                modalTitle: 'Bitcoin Address',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#F7931A"><path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.7-.17-1.053-.252l.53-2.127-1.312-.33-.54 2.165c-.285-.065-.565-.13-.84-.2l-1.815-.45-.35 1.407s.974.225.955.238c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.655 1.51 1.71.426.93.236-.54 2.19 1.313.327.54-2.17c.36.1.705.19 1.05.273l-.538 2.155 1.315.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.52 2.75 2.084v.006z"/></svg>`
            },
            { 
                name: 'ETH', 
                prefix: '', 
                color: '#627EEA', 
                modalTitle: 'Ethereum Address',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#627EEA"><path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/></svg>`
            },
            { 
                name: 'LTC', 
                prefix: '', 
                color: '#345D9D', 
                modalTitle: 'Litecoin Address',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#345D9D"><path d="M12 0a12 12 0 1012 12A12 12 0 0012 0zm-.262 3.678h2.584a.343.343 0 01.33.435l-2.03 6.918 1.905-.582-.478 1.58-1.906.59L10.9 17.161h6.063a.343.343 0 01.329.436l-.358 1.2a.343.343 0 01-.33.248H7.065l1.349-4.584-1.98.608.494-1.58 1.98-.61L11.368 4.1a.343.343 0 01.37-.422z"/></svg>`
            },
            { 
                name: 'XMR', 
                prefix: '', 
                color: '#FF6600', 
                modalTitle: 'Monero Address',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#FF6600"><path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm-.046 4.453l4.778 4.778v4.629h-2.39v-3.2l-2.388-2.387-2.388 2.388v3.199h-2.39V9.23l4.778-4.778zm-7.5 11.16h2.39v2.934h5.11v-4.86l1.502 1.5 1.502-1.5v4.86h5.11v-2.935h2.39v5.325H4.453v-5.325z"/></svg>`
            },
            { 
                name: 'Mail', 
                prefix: 'mailto:', 
                color: '#ffffff', 
                modalTitle: 'Email Address',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#ffffff"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>`
            },
            { 
                name: 'Roblox', 
                prefix: 'roblox.com/users/', 
                color: '#FF0000', 
                modalTitle: 'Roblox User ID',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#FF0000"><path d="M5.164 0L.16 18.928l18.718 5.07L23.88 5.07 5.164 0zm7.78 13.873l-3.748-1.02 1.016-3.74 3.748 1.02-1.016 3.74z"/></svg>`
            },
            { 
                name: 'NameMC', 
                prefix: 'namemc.com/profile/', 
                color: '#4caf50', 
                modalTitle: 'NameMC Profile',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#4caf50"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.18 7 12 9.82 4.82 7 12 4.18zM4 8.72l7 3.5v7.5l-7-3.5v-7.5zm9 11v-7.5l7-3.5v7.5l-7 3.5z"/></svg>`
            },
            { 
                name: 'Steam', 
                prefix: 'steamcommunity.com/id/', 
                color: '#ffffff', 
                modalTitle: 'Steam Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#ffffff"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/></svg>`
            },
            { 
                name: 'Custom URL', 
                prefix: '', 
                color: '#9333EA', 
                modalTitle: 'Custom URL',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#9333EA"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`
            },
            { 
                name: 'Gitlab', 
                prefix: 'gitlab.com/', 
                color: '#FC6D26', 
                modalTitle: 'Gitlab Username',
                icon: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#FC6D26"><path d="m23.6 9.593-.033-.086L20.3.98a.851.851 0 0 0-.336-.405.87.87 0 0 0-.52-.144.87.87 0 0 0-.52.144.85.85 0 0 0-.334.405l-2.217 6.748H7.63L5.414.98a.851.851 0 0 0-.336-.405.87.87 0 0 0-.52-.144.87.87 0 0 0-.522.144.85.85 0 0 0-.333.405L.434 9.51l-.033.083a6.01 6.01 0 0 0 1.992 6.954l.01.008.028.02 4.91 3.696 2.432 1.842 1.48 1.12a1.008 1.008 0 0 0 1.22 0l1.48-1.12 2.432-1.842 4.938-3.715.012-.01a6.01 6.01 0 0 0 1.992-6.953z"/></svg>`
            }
        ];
    }

    async renderConnections() {
        const connections = await this.fetchConnections();
        const contentArea = document.getElementById('contentArea');
        const allPlatforms = this.getSocialPlatforms();
        
        const connectedPlatforms = connections.map(c => c.platform.toLowerCase());
        const availablePlatforms = allPlatforms.filter(p => !connectedPlatforms.includes(p.name.toLowerCase()));
        
        const getPlatformIcon = (platformName) => {
            const platform = allPlatforms.find(p => p.name.toLowerCase() === platformName.toLowerCase());
            return platform ? platform.icon : `<svg viewBox="0 0 24 24" width="24" height="24" fill="#9333EA"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`;
        };

        const getPlatformUrl = (conn) => {
            const platform = allPlatforms.find(p => p.name.toLowerCase() === conn.platform.toLowerCase());
            if (platform && platform.prefix) {
                return `https://${platform.prefix}${conn.username || conn.profile_url || ''}`;
            }
            return conn.profile_url || conn.username || '';
        };
        
        contentArea.innerHTML = `
            <div class="page-header">
                <button class="page-back" onclick="dashboard.loadPage('overview')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                </button>
                <div>
                    <h1 class="page-title">Connections</h1>
                    <p class="page-subtitle">Link your social media and crypto profiles</p>
                </div>
            </div>
            
            <div class="connections-container">
                <div class="connections-card">
                    <h2 class="connections-section-title">New Socials</h2>
                    <div class="social-icons-grid">
                        ${allPlatforms.map(plat => {
                            const isConnected = connectedPlatforms.includes(plat.name.toLowerCase());
                            return `
                                <button class="social-icon-btn ${isConnected ? 'connected' : ''}" 
                                    title="${plat.name}${isConnected ? ' (Connected)' : ''}" 
                                    onclick="dashboard.showConnectionModal('${plat.name}', '${plat.prefix}', '${plat.modalTitle}')"
                                    ${isConnected ? 'style="opacity: 0.4; cursor: not-allowed;"' : ''}>
                                    ${plat.icon}
                                </button>
                            `;
                        }).join('')}
                    </div>
                </div>
                
                <div class="connections-card">
                    <h2 class="connections-section-title">Existing Socials</h2>
                    ${connections.length === 0 ? `
                        <div class="empty-connections">
                            <p>No connections yet. Click an icon above to add one.</p>
                        </div>
                    ` : `
                        <div class="existing-socials-grid">
                            ${connections.map(conn => {
                                const url = getPlatformUrl(conn);
                                return `
                                    <div class="existing-social-item">
                                        <div class="social-item-icon">
                                            ${getPlatformIcon(conn.platform)}
                                        </div>
                                        <div class="social-item-info">
                                            <span class="social-item-name">${conn.platform}</span>
                                            <span class="social-item-url">${url}</span>
                                        </div>
                                        <button class="social-delete-btn" onclick="dashboard.deleteConnection('${conn.id}', '${conn.platform}')" title="Delete">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    showConnectionModal(platformName, prefix = '', modalTitle = '') {
        const existingModal = document.getElementById('connectionModal');
        if (existingModal) existingModal.remove();
        
        const title = modalTitle || `${platformName} Username`;
        const displayPrefix = prefix ? prefix : '';
        
        const modal = document.createElement('div');
        modal.id = 'connectionModal';
        modal.className = 'connection-modal-overlay';
        modal.innerHTML = `
            <div class="connection-modal">
                <div class="connection-modal-header">
                    <h2 class="connection-modal-title">${title}</h2>
                    <button class="connection-modal-close" onclick="document.getElementById('connectionModal').remove()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                
                <div class="connection-modal-body">
                    <div class="connection-input-wrapper">
                        <svg class="connection-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                        ${displayPrefix ? `<span class="connection-input-prefix">${displayPrefix}</span>` : ''}
                        <input type="text" id="connUsername" class="connection-input" placeholder="Enter ${platformName}" autocomplete="off">
                    </div>
                </div>
                
                <button class="connection-submit-btn" onclick="dashboard.saveConnection('${platformName}', '${prefix}')">
                    Submit
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
            }
        });
        
        setTimeout(() => document.getElementById('connUsername')?.focus(), 100);
    }

    async saveConnection(platformName, prefix = '') {
        const input = document.querySelector('#connUsername');
        const username = input?.value.trim();
        
        if (!username) {
            this.showToast('Please enter a username', 'error');
            return;
        }
        
        let profileUrl = username;
        if (prefix && !username.startsWith('http')) {
            profileUrl = `https://${prefix}${username}`;
        }
        
        try {
            const response = await fetch('/api/connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    platform: platformName,
                    username: username,
                    profile_url: profileUrl
                })
            });
            
            if (response.ok) {
                this.showToast(`${platformName} connected successfully`, 'success');
                document.getElementById('connectionModal')?.remove();
                this.renderConnections();
            } else {
                const err = await response.json();
                this.showToast(err.error || 'Failed to connect', 'error');
            }
        } catch (error) {
            this.showToast('Failed to connect platform', 'error');
            console.error(error);
        }
    }

    async deleteConnection(connectionId, platformName) {
        try {
            const response = await fetch(`/api/connections/${connectionId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.ok) {
                this.showToast('Link has been deleted', 'success');
                this.renderConnections();
            } else {
                this.showToast('Failed to delete connection', 'error');
            }
        } catch (error) {
            this.showToast('Failed to delete connection', 'error');
            console.error(error);
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
