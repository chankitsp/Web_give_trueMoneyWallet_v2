document.addEventListener('DOMContentLoaded', () => {
    const countdownEl = document.getElementById('countdown');
    const statusTextEl = document.getElementById('status-text');
    const claimFormContainer = document.getElementById('claim-form-container');
    const claimForm = document.getElementById('claim-form');

    // Get Event Code from URL
    const pathParts = window.location.pathname.split('/');
    const eventCode = pathParts[pathParts.length - 1];

    if (!eventCode || eventCode === '') {
        console.warn('No event code found in URL');
    }

    // Fetch Event Config
    async function fetchConfig() {
        try {
            const res = await fetch(`/api/eventurl-config/${eventCode}`);
            if (!res.ok) {
                statusTextEl.innerText = 'ไม่พบกิจกรรมนี้';
                return;
            }
            const config = await res.json();
            updateTimer(config);
        } catch (err) {
            console.error('Error fetching config:', err);
            statusTextEl.innerText = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
        }
    }

    function updateTimer(config) {
        const now = new Date().getTime();
        const startTime = new Date(config.startTime).getTime();
        const endTime = new Date(config.endTime).getTime();

        if (now < startTime) {
            // Not started
            const distance = startTime - now;
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            countdownEl.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            statusTextEl.innerText = `กำลังจะเปิดให้รับรางวัลในอีก`;
            claimFormContainer.classList.add('hidden');

            setTimeout(() => fetchConfig(), 1000);

        } else if (now >= startTime && now < endTime) {
            // Open
            if (!config.isSystemOpen) {
                countdownEl.innerHTML = "PAUSED";
                statusTextEl.innerText = "ระบบปิดปรับปรุงชั่วคราว";
                claimFormContainer.classList.add('hidden');
            } else {
                const distance = endTime - now;
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                countdownEl.innerHTML = `${hours}h ${minutes}m ${seconds}s`;
                statusTextEl.innerText = "จะหมดเวลาในอีก";
                claimFormContainer.classList.remove('hidden');

                setTimeout(() => updateTimer(config), 100);
            }
        } else {
            // Ended
            countdownEl.innerHTML = "ENDED";
            statusTextEl.innerText = "หมดเวลารับรางวัลแล้ว";
            claimFormContainer.classList.add('hidden');
        }
    }

    claimForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('code').value;

        try {
            const res = await fetch('/api/check-code-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, eventCode })
            });
            const data = await res.json();

            if (data.success) {
                const resultContainer = document.getElementById('result-container');
                const rewardLink = document.getElementById('reward-link');

                rewardLink.href = data.rewardUrl;
                rewardLink.innerText = data.rewardUrl; // Or "คลิกที่นี่เพื่อรับรางวัล"
                resultContainer.classList.remove('hidden');

                // Optional: Hide form or disable button?
                // document.querySelector('#claim-form button').disabled = true;
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'รหัสไม่ถูกต้อง',
                    text: 'กรุณากรอกรหัสให้ถูกต้อง'
                });
            }

        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
            });
        }
    });

    // Initial load
    if (eventCode) {
        fetchConfig();
    }
});
