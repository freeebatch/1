import fetch from 'node-fetch';

// Middleware
async function authLogin(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('/login'); // Return after sending response
    }
    const url = 'https://api.penpencil.co/v3/oauth/verify-token';
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        "Accept": "application/json, text/plain, */*",
        "randomId": "344163b-ebef-ace-8fa-2a1c8863fd5a"
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers
        });
        const data = await response.json();
        if (data.success) {
            next(); // Call next middleware or route handler
        } else {
            return res.redirect('/login'); // Return after sending response
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        return res.status(500).send('Internal Server Error'); // Return after sending response
    }
}

export default authLogin;
