import { request } from 'express';
import fetch from 'node-fetch';
import { DOMParser } from 'xmldom';
import { Token } from '../models/batches.js'

const convertMPDToHLS = async (mpdId, quality) => {
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

        let mainUrl = `https://d1bppx4iuv3uee.cloudfront.net/${mpdId}/hls/${quality}`
        let mpdUrl2 = `https://d1bppx4iuv3uee.cloudfront.net/${mpdId}/hls/${quality}/main.m3u8`;

        const main_data = await fetch(mpdUrl2);

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

        const main_data2 = await main_data.text();
        const pattern = /(\d{3,4}\.ts)/g;
        const replacement = `${mainUrl}/$1${data.data}`;
        const newText = main_data2.replace(pattern, replacement).replace("https://api.penpencil.co/v1/videos/", `https://studywithme.onrender.com/`)

        return newText;
    } catch (error) {
        console.error("Error converting MPD to HLS:", error);
    }
};

const multiQualityHLS = async (mpdId) => {
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
                hlsPlaylist += `https://studywithme.onrender.com/hls?v=${mpdId}&quality=${quality}\n`;

            }
        }
        return hlsPlaylist;


    } catch (error) {
        console.error("Error converting MPD to HLS:", error);
    }

}

export { convertMPDToHLS, multiQualityHLS };
