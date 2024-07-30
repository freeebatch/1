import fetch from 'node-fetch'; // Import fetch for making HTTP requests
import cheerio from 'cheerio';

async function findKey(url) {
    try {
        console.log("Finding Keys for ", url)
        url = `https://pw-db-6a6ef38cc8ac.herokuapp.com/pw?videourl=${url}`
        const response = await fetch(url, {
            method: "GET",
        });
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return null;
            // throw error;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return null;
        // throw error;
    }
}

async function findKey2(url) {
    return null;
    console.log("Here ", url)
    url = `https://api-sarkari.koyeb.app/pw?link=${url}`;
    const response = await fetch(url, {
        method: 'GET'
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const html = await response.text();
    const regex = /const protData = ({.*?});/s;
    const match = regex.exec(html);
    if (match && match[1]) {
        const protData = JSON.parse(match[1]);
        const clearkeys = protData['org.w3.clearkey'].clearkeys;
        const transformedClearkeys = Object.entries(clearkeys).reduce((acc, [kid, k]) => {
            acc.push({ "kid": kid, "k": k });
            return acc;
        }, []);
        console.log('Found Keys: ', transformedClearkeys);
        return transformedClearkeys[0];
    } else {
        console.log('protData not found in HTML content');
    }
}

export { findKey, findKey2 };
