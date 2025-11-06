(function () {
    const authToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

    if (!authToken) {
        window.location.href = '/login';
        return;
    }

    fetch('https://drugs.rip/api/token/exchange', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => {
            if (response.status === 401) {
                window.location.href = '/login';
                return null;
            }
            return response.json();
        })
        .then(data => {
            if (!data || !data.success) {
                window.location.href = '/login';
            }
        })
        .catch(() => {
            window.location.href = '/login';
        });
})();