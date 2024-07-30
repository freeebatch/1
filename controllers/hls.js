import { request } from 'express';
import fetch from 'node-fetch';
import { DOMParser } from 'xmldom';
import { Token } from '../models/batches.js'

import CryptoJS from 'crypto-js'


const convertMPDToHLS = async (mpdId, quality, type) => {
    try {
        let db = await Token.findOne();
        const access_token = db.access_token;
        const refresh_token = db.refresh_token;

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
                const response = await fetch('https://api.penpencil.co/v3/oauth/refresh-token', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${access_token}`,
                        'randomId': 'ae9e92ac-b162-4089-9830-1236bddf9761',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "refresh_token": refresh_token,
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

        let token = access_token;
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

        console.log("###########################################3")

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
        }

        // const fetchSignedUrl = async (mpdId, token) => {
        //     console.log(mpdId)
        //     const url = 'https://api.penpencil.co/v1/files/signed-url?reqType=cookie&gcpCdnType=media';
        //     const options = {
        //         method: 'POST',
        //         headers: {
        //             'Host': 'api.penpencil.co',
        //             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
        //             'Accept': '*/*',
        //             'Accept-Language': 'en-US,en;q=0.5',
        //             'Content-Type': 'application/json',
        //             'Randomid': 'e49531a3-8382-435b-aa52-f62adb92d73d',
        //             'Authorization': `Bearer ${token}`
        //         },
        //         body: JSON.stringify({
        //             url: `https://sec1.pw.live/3e791689-8402-4a8d-acad-38831ef7ffe6/master.mpd`
        //         }),
        //     };
        //     try {
        //         const response = await fetch(url, options);
        //         if (!response.ok) {
        //             throw new Error(`HTTP error! Status: ${response.status}`);
        //         }
        //         const data = await response.json();
        //         console.log(data);
        //         return data;
        //     } catch (error) {
        //         console.error('Error in fetching Signed Url:', error.message);
        //         return null;
        //     }
        // };
        // consct jsonResponse = await fetchSignedUrl(mpdId, token)

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


        let mainUrl = `https://sec1.pw.live/${mpdId}/hls/${quality}`
        let mpdUrl2 = `https://sec1.pw.live/${mpdId}/hls/${quality}/main.m3u8`;

        const response = await fetch('https://api.penpencil.co/v3/files/send-analytics-data', {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 24_6 like Mac OS X) AppleWebKit/605.5.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
                'Content-Type': 'application/json',
                'client-type': 'WEB',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 'url': `${mpdUrl2}` })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const extractedParams = getQueryParams(data.data);

        const cloudFrontPolicy = decryptCookieValue(extractedParams['Policy']);
        const cloudFrontKeyPairId = decryptCookieValue(extractedParams['Key-Pair-Id']);
        const cloudFrontSignature = decryptCookieValue(extractedParams['Signature']);

        const options = {
            method: 'GET',
            headers: {
              'Cookie': `CloudFront-Policy=${cloudFrontPolicy}; CloudFront-Key-Pair-Id=${cloudFrontKeyPairId}; CloudFront-Signature=${cloudFrontSignature}`,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
              'Accept': '*/*',
            }
          };
        const main_data = await fetch(mpdUrl2, options);

        
        const main_data2 = await main_data.text();
        const pattern = /(\d{3,4}\.ts)/g;
        
        let replacement = '';
        if (type === "download") {
            replacement = `${mainUrl}/$1?Policy=${cloudFrontPolicy}&Key-Pair-Id=${cloudFrontKeyPairId}&Signature=${cloudFrontSignature}`;
        } else {
            replacement = `https://studywithme.onrender.com/dash/${mpdId}/hls/${quality}/$1?Policy=${cloudFrontPolicy}&Key-Pair-Id=${cloudFrontKeyPairId}&Signature=${cloudFrontSignature}`;
        }
        
        const newText = main_data2.replace(pattern, replacement).replace("https://api.penpencil.co/v1/videos/", `https://studywithme.onrender.com/`)
        
        return newText;
    } catch (error) {
        console.error("Error converting MPD to HLS:", error);
    }
};

const multiQualityHLS = async (mpdId, type) => {
    try {
        let mpdUrl = `https://d1d34p8vz63oiq.cloudfront.net/${mpdId}/master.mpd`;

        // Fetch the MPD file
        const response = await fetch(mpdUrl);
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

                // Determine quality base URL
                const quality = height;
                if (!quality) continue;

                hlsPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${height}\n`;
                if(type === 'play'){
                    hlsPlaylist += `https://studywithme.onrender.com/hls?v=${mpdId}&quality=${quality}&type=play\n`;
                }else{
                    hlsPlaylist += `https://studywithme.onrender.com/hls?v=${mpdId}&quality=${quality}&type=download\n`;
                }

            }
        }
        return hlsPlaylist;


    } catch (error) {
        console.error("Error converting MPD to HLS:", error);
    }

}

export { convertMPDToHLS, multiQualityHLS };
