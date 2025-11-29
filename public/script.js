document.addEventListener('DOMContentLoaded', () => {
    const countdownEl = document.getElementById('countdown');
    const statusTextEl = document.getElementById('status-text');
    const claimFormContainer = document.getElementById('claim-form-container');
    const claimForm = document.getElementById('claim-form');
    let queuePollInterval;

    // Get Event Code from URL
    const pathParts = window.location.pathname.split('/');
    const eventCode = pathParts[pathParts.length - 1];

    if (!eventCode || eventCode === 'index.html' || eventCode === '') {
        // Handle case where user visits root or invalid path
        // For now, maybe redirect to admin or show error?
        // Or just let it fail gracefully if not in event mode
        console.warn('No event code found in URL');
    }

    // Fetch Event Config
    async function fetchConfig() {
        try {
            const res = await fetch(`/api/event-config/${eventCode}`);
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

                setTimeout(() => updateTimer(config), 100); // Keep updating timer locally
            }
        } else {
            // Ended
            countdownEl.innerHTML = "ENDED";
            statusTextEl.innerText = "หมดเวลารับรางวัลแล้ว";
            claimFormContainer.classList.add('hidden');
        }
    }

    function pad(num) {
        return num < 10 ? '0' + num : num;
    }

    claimForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('phone').value;
        const code = document.getElementById('code').value;

        // Validate Phone Number
        const phoneRegex = /^0[689]\d{8}$/;
        if (!phoneRegex.test(phone)) {
            Swal.fire({
                icon: 'error',
                title: 'เบอร์โทรศัพท์ไม่ถูกต้อง',
                text: 'กรุณาตรวจสอบเบอร์โทรศัพท์อีกครั้ง'
            });
            return;
        }

        // 1. Check Code
        try {
            const codeRes = await fetch('/api/check-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, eventCode })
            });
            const codeData = await codeRes.json();

            if (!codeData.valid) {
                Swal.fire({
                    icon: 'error',
                    title: 'รหัสไม่ถูกต้อง',
                    text: 'กรุณาตรวจสอบรหัสรับรางวัล'
                });
                return;
            }

            // 2. Join Queue
            const joinRes = await fetch('/api/join-queue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber: phone, eventCode })
            });
            const joinData = await joinRes.json();

            if (joinData.success) {
                // Show waiting modal
                pollQueueStatus(phone);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่สามารถเข้าคิวได้',
                    text: joinData.message
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

    function pollQueueStatus(phoneNumber) {
        // Clear existing interval if any to prevent duplicates
        if (queuePollInterval) clearInterval(queuePollInterval);

        let isModalOpen = true;

        Swal.fire({
            title: 'กำลังรอคิว...',
            html: 'กำลังตรวจสอบลำดับคิวของคุณ...',
            allowOutsideClick: false,
            showConfirmButton: true,
            confirmButtonText: 'ตกลง'
        }).then((result) => {
            if (result.isConfirmed) {
                // User clicked "OK" (Background wait)
                isModalOpen = false;
            }
        });

        // Start polling - continues even if Swal is closed
        queuePollInterval = setInterval(async () => {
            try {
                const res = await fetch(`/api/queue-status/${eventCode}/${phoneNumber}`);
                const data = await res.json();

                if (data.status === 'not_found') {
                    clearInterval(queuePollInterval);
                    if (isModalOpen) {
                        Swal.fire({
                            icon: 'error',
                            title: 'หลุดจากคิว',
                            text: 'กรุณากดรับรางวัลใหม่อีกครั้ง'
                        });
                    }
                    return;
                }

                // Update Swal content if open
                if (isModalOpen && Swal.isVisible()) {
                    const content = Swal.getHtmlContainer();
                    if (content) {
                        content.innerHTML = `
                            <h3>คุณอยู่ในคิวที่ ${data.queueNumber}</h3>
                            <p>มีคนรอหน้าคุณ <b>${data.peopleAhead}</b> คน</p>
                            <p>ประมาณ <b>${data.estimatedWaitTime}</b> วินาที</p>
                        `;
                    }
                }

                // Check status
                if (data.status === 'completed') {
                    clearInterval(queuePollInterval);
                    Swal.fire({
                        icon: 'success',
                        title: 'รับรางวัลสำเร็จ!',
                        text: 'เงินถูกโอนเข้าบัญชีแล้ว'
                    });
                } else if (data.status === 'failed') {
                    clearInterval(queuePollInterval);

                    if (data.failureReason === 'TARGET_USER_REDEEMED') {
                        Swal.fire({
                            icon: 'warning',
                            title: 'คุณเคยรับซองนี้แล้ว',
                            text: 'เบอร์โทรศัพท์นี้ได้รับซองนี้ไปแล้ว ไม่สามารถรับซ้ำได้'
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'รับรางวัลไม่สำเร็จ',
                            text: 'เกิดข้อผิดพลาดในการโอนเงิน กรุณาลองใหม่'
                        });
                    }
                }

            } catch (err) {
                console.error(err);
            }
        }, 2000); // Poll every 2 seconds
    }

    // History Function
    async function fetchHistory() {
        if (!eventCode) return;
        try {
            const res = await fetch(`/api/queue-history/${eventCode}`);
            const history = await res.json();

            const list = document.getElementById('history-list');
            list.innerHTML = '';

            history.forEach(item => {
                const li = document.createElement('li');
                li.className = 'history-item';

                let statusText = item.status;
                let statusClass = `status-${item.status}`;

                switch (item.status) {
                    case 'waiting': statusText = 'รอคิว'; break;
                    case 'processing': statusText = 'กำลังโอน'; break;
                    case 'completed': statusText = 'สำเร็จ'; break;
                    case 'failed': statusText = 'ไม่สำเร็จ'; break;
                }

                li.innerHTML = `
                    <span>คิวที่ ${item.queueNumber} (${item.phoneNumber})</span>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                `;
                list.appendChild(li);
            });
        } catch (err) {
            console.error('History error:', err);
        }
    }

    // Initial load and periodic update
    if (eventCode) {
        fetchConfig();
        fetchHistory();
        setInterval(fetchHistory, 5000); // Update history every 5 seconds
    }
});
