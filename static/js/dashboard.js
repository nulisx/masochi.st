        
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
    
}
    exportBiolinkSettings() {
