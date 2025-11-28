const checkIp = (req, res, next) => {
    const allowedIps = (process.env.ADMIN_IPS || '').split(',').map(ip => ip.trim());
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // Normalize IPv6 localhost
    const normalizedIp = clientIp === '::1' ? '127.0.0.1' : clientIp;

    // Check if IP is allowed (allow localhost ::1 and 127.0.0.1 by default if not specified, or strictly follow env)
    // Actually, let's strictly follow env, but handle the ::1 case for local dev

    const isAllowed = allowedIps.some(ip => {
        if (ip === '::1' && clientIp === '::1') return true;
        if (ip === '127.0.0.1' && (clientIp === '127.0.0.1' || clientIp === '::1')) return true;
        return clientIp.includes(ip);
    });

    if (isAllowed) {
        next();
    } else {
        res.status(403).send('Access Denied');
    }
};

module.exports = checkIp;
