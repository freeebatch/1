import { request } from 'express';
import fetch from 'node-fetch';
import { DOMParser } from 'xmldom';
import { Token } from '../models/batches.js'

import CryptoJS from 'crypto-js'
import { run } from 'node:test';


const verifyToken = async (token) => {
    try {
        const response = await fetch('https://api.penpencil.co/v3/oauth/verify-token', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'randomId': 'ae9e92ac-b162-4089-9830-1236bddf9761'
            }
        });
        const data = await response.json();
        return data.data.isVerified;
    } catch (error) {
        return false;
    }
};

const refreshToken = async () => {
    try {
        const db = await Token.findOne();
        const response = await fetch('https://api.penpencil.co/v3/oauth/refresh-token', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${db.access_token}`,
                'randomId': 'ae9e92ac-b162-4089-9830-1236bddf9761',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "refresh_token": db.refresh_token,
                "client_id": "system-admin"
            })
        });
        const data = await response.json();
        await Token.findOneAndUpdate({},
            {
                access_token: data.data.access_token,
                refresh_token: data.data.refresh_token
            },
            { new: true, upsert: true }
        );

        console.log("Token Updated");
        return data.data.access_token;
    } catch (error) {
        console.log(error.message);
        return null;
    }
};

const getToken = async () => {
    let db = await Token.findOne();
    let token = db.access_token;

    let isTokenVerified = await verifyToken(token);
    if (!isTokenVerified) {
        token = await refreshToken();
        if (!token) {
            return null;
        }
        isTokenVerified = await verifyToken(token);
    }
    if (!isTokenVerified) {
        return null;
    }

    return token;
};

const decryptCookieValue =  (encryptedValue) => {
    const videoEncryptionKey = CryptoJS.enc.Utf8.parse("pw3c199c2911cb437a907b1k0907c17n");
    const initialisationVector = CryptoJS.enc.Utf8.parse("5184781c32kkc4e8");
    const encryptedData = CryptoJS.enc.Base64.parse(encryptedValue);
    const decrypted = CryptoJS.AES.decrypt({ ciphertext: encryptedData }, videoEncryptionKey, {
        iv: initialisationVector,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
};

function getQueryParams(data) {
    const params = {};
    const queryString = data.startsWith('?') ? data.slice(1) : data; // Remove the leading '?'
    const pairs = queryString.split('&');

    pairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
    });

    return params;
}

const getHeaders = async (mpdUrl) => {
    const token = await getToken();
    if(!token) return null;

    const response = await fetch('https://api.penpencil.co/v3/files/send-analytics-data', {
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 24_6 like Mac OS X) AppleWebKit/605.5.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
            'Content-Type': 'application/json',
            'client-type': 'WEB',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 'url': mpdUrl })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const extractedParams = getQueryParams(data.data);

    const cloudFrontPolicy = decryptCookieValue(extractedParams['Policy']);
    const cloudFrontKeyPairId = decryptCookieValue(extractedParams['Key-Pair-Id']);
    const cloudFrontSignature = decryptCookieValue(extractedParams['Signature']);

    // return {
    //     cloudFrontPolicy,
    //     cloudFrontKeyPairId,
    //     cloudFrontSignature
    // };
    return {
        'Cookie': `CloudFront-Policy=${cloudFrontPolicy}; CloudFront-Key-Pair-Id=${cloudFrontKeyPairId}; CloudFront-Signature=${cloudFrontSignature}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
        'Accept': '*/*',
    };
};



const convertMPDToHLS = async (mpdId, quality, type) => {
    try {
        // Generate the MPD and HLS URLs
        let mainUrl = `https://sec1.pw.live/${mpdId}/hls/${quality}`;
        let mpdUrl2 = `https://sec1.pw.live/${mpdId}/hls/${quality}/main.m3u8`;

        // Get headers with CloudFront cookies
        const headers = await getHeaders(mpdUrl2);
        if(!headers) return null;
        
        // Fetch the main M3U8 file with appropriate headers
        const response = await fetch(mpdUrl2, { method: 'GET', headers });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const main_data2 = await response.text();

        // Replace the URLs with the appropriate type (play/download)
        const pattern = /(\d{3,4}\.ts)/g;
        let replacement = '';
        if (type === "download") {
            replacement = `${mainUrl}/$1?Policy=${headers['Cookie'].match(/CloudFront-Policy=([^;]+)/)[1]}&Key-Pair-Id=${headers['Cookie'].match(/CloudFront-Key-Pair-Id=([^;]+)/)[1]}&Signature=${headers['Cookie'].match(/CloudFront-Signature=([^;]+)/)[1]}`;
        } else {
            replacement = `https://studywithme-alpha.vercel.app/dash/${mpdId}/hls/${quality}/$1?Policy=${headers['Cookie'].match(/CloudFront-Policy=([^;]+)/)[1]}&Key-Pair-Id=${headers['Cookie'].match(/CloudFront-Key-Pair-Id=([^;]+)/)[1]}&Signature=${headers['Cookie'].match(/CloudFront-Signature=([^;]+)/)[1]}`;
        }
        
        const newText = main_data2
            .replace(pattern, replacement)
            .replace("https://api.penpencil.xyz/v1/videos/", `https://studywithme-alpha.vercel.app/`);

        return newText;
    } catch (error) {
        console.error("Error converting MPD to HLS:", error);
    }
};

const multiQualityHLS = async (mpdId, type) => {
    try {
        let mpdUrl = `https://d1d34p8vz63oiq.cloudfront.net/${mpdId}/master.mpd`;

        // Get headers with CloudFront cookies
        const headers = await getHeaders(mpdUrl);
        if(!headers) return null;

        // Fetch the MPD file with appropriate headers
        const response = await fetch(mpdUrl, { method: 'GET', headers });
        const xmlText = await response.text();

        // Parse the MPD XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "application/xml");

        // Get AdaptationSet and Representation elements
        const adaptationSets = xmlDoc.getElementsByTagName("AdaptationSet");

        let hlsPlaylist = "#EXTM3U\n";
        hlsPlaylist += "#EXT-X-VERSION:3\n";

        for (let i = 0; i < adaptationSets.length; i++) {
            const adaptationSet = adaptationSets[i];
            const representations = adaptationSet.getElementsByTagName("Representation");

            for (let j = 0; j < representations.length; j++) {
                const representation = representations[j];
                const width = representation.getAttribute("width");
                const height = representation.getAttribute("height");
                const bandwidth = representation.getAttribute("bandwidth");

                const quality = height;
                if (!quality) continue;

                hlsPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${height}\n`;
                if(type === 'play'){
                    hlsPlaylist += `https://studywithme-alpha.vercel.app/hls?v=${mpdId}&quality=${quality}&type=play\n`;
                }else{
                    hlsPlaylist += `https://studywithme-alpha.vercel.app/hls?v=${mpdId}&quality=${quality}&type=download\n`;
                }
            }
        }
        return hlsPlaylist;
    } catch (error) {
        console.error("Error converting MPD to HLS:", error);
    }
};

export { convertMPDToHLS, multiQualityHLS };