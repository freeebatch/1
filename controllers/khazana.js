import fetch from 'node-fetch';

export async function paidBatches(token) {
    const url = 'https://api.penpencil.co/v3/batches/my-batches?mode=1&amount=paid&page=1';
    const headers = {
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Use Promise.all to resolve all async operations inside map
        const extractedData = await Promise.all(data.data.map(async item => ({
            name: item.name,
            byName: item.byName,
            language: item.language,
            previewImage: `${item.previewImage ? item.previewImage.baseUrl + item.previewImage.key : ''}`,
            slug: item.slug,
            khazanaProgramId: await getKhazanaProgramId(token, item.slug) // Ensure this is awaited properly
        })));

        return { data: extractedData };
    } catch (error) {
        console.error('Error fetching data:', error);
        return { data: [] }; // Return an empty array in case of error to avoid undefined issues
    }
}


async function getKhazanaProgramId(token, batchName) {
    const url = `https://api.penpencil.co/v3/batches/${batchName}/details`;
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const khazanaProgramId = data.data.khazanaProgramId;

        return khazanaProgramId;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

export async function subjects(token, khazanaProgramId) {
    const url = `https://api.penpencil.co/v1/programs/${khazanaProgramId}/subjects?page=1`;
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Use Promise.all to wait for all async calls
        const extractedData = await Promise.all(
            data.data.map(async item => {
                return {
                    name: item.name,
                    slug: item.slug,
                    chapters: await chapters(token, item.programId, item._id)
                };
            })
        );

        return { data: extractedData, success: true };
    } catch (error) {
        console.error('Error fetching data:', error);
        return { data: [], success: false };
    }
}


const chapters = async (token, programId, id) => {
    const url = `https://api.penpencil.co/v2/programs/${programId}/subjects/${id}/chapters?page=1&limit=10`;
    const headers = {
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const extractedData = data.data.map(item => ({
            name: `${item.name} ${item.description}`,
            organizationId: item.organizationId,
            programId: item.programId,
            subjectId: item.subjectId,
            slug: item.slug,
            previewImage: `${item.imageId ? item.imageId?.baseUrl + item.imageId?.key : 'https://static.pw.live/react-batches/assets/banner.png'}`,
        }));

        return extractedData;
    } catch (error) {
        console.error('Error fetching data:', error);
    }

}


export const topics = async (token, khazanaProgramId, slugT, slugC) => {
    const url = `https://api.penpencil.co/v1/programs/${khazanaProgramId}/subjects/${slugT}/chapters/${slugC}/topics?page=1`
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const extractedData = data.data.map(item => ({
            name: item.name,
            topicId: item._id,
            totalLectures: item.totalLectures,
            totalNotes: item.totalConcepts,
            totalExercises: item.totalExercises,
        }));

        return extractedData


    } catch (error) {
        console.error('Error fetching data:', error);
        return { data: [], success: false }; // Return a consistent structure even on failure
    }
}


async function getSlug(token, programId, subjectIdSlug, chapterIdSlug, topicId, key) {
    try {
        const url = `https://api.penpencil.co/v1/programs/${programId}/subjects/${subjectIdSlug}/chapters/${chapterIdSlug}/topics/${topicId}/contents/sub-topic?page=1`;
        const headers = {
            'Authorization': `Bearer ${token}`
        };
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.data || !Array.isArray(data.data)) {
            throw new Error("Invalid or empty data received");
        }

        // Use find() to return the first matching slug
        const foundItem = data.data.find(item => item.name === key);
        
        return foundItem ? foundItem.slug : null; // Return null if not found
    } catch (error) {
        console.error('Error fetching data:', error.message);
        return null; // Return null instead of throwing error to avoid breaking flow
    }
}


export async function videosBatch(token, programId, subjectIdSlug, chapterIdSlug, topicId, page = 1, retryCount = 3) {
    const subTopicId = await getSlug(token, programId, subjectIdSlug, chapterIdSlug, topicId, 'Lectures');

    let videosBatchPage = 1;
    const extractedData = [];
    try {
        while (true) {
            // https://api.penpencil.co/v2/programs/contents?programId=653543ca81e74c00187aff4e&subjectId=c-programming---computer-science-618106&chapterId=c-programming-by-697891&topicId=6535485db7a2c00018d423c7&subTopicId=lectures-713019&page=1
            const url = `https://api.penpencil.co/v2/programs/contents?programId=${programId}&subjectId=${subjectIdSlug}&chapterId=${chapterIdSlug}&topicId=${topicId}&subTopicId=${subTopicId}&page=${videosBatchPage}`;
            const headers = {
                'Authorization': `Bearer ${token}`,
                'randomid': 'c818e543-8bdd-4207-86f0-717f922a2eaa',
                'Client-Id': '5eb393ee95fab7468a79d189'
            };
            const response = await fetch(url, { headers });
            if (!response.ok) {
                const status = response.status;
                if (status === 429 && retryCount > 0) {
                    console.warn(`Received 429 status, retrying... (Attempts left: ${retryCount})`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    // Retry the request
                    return await videosBatch(token, programId, subjectIdSlug, chapterIdSlug, topicId, page, retryCount - 1);
                } else {
                    console.log("Err ", status)
                    return null
                }
            }
            const data = await response.json();
            if (!(data && data.data && data.data.length >= 1)) {
                break;
            }
            data.data.forEach(item => {
                if (item.content[0]) {
                    const extractedItem = {
                        topic: item.title,
                        date: item.content[0].videoDetails.createdAt,
                        videoDetails: {
                            name: item.content[0].videoDetails.name,
                            image: item.content[0].videoDetails.image,
                            videoUrl: item.content[0].videoDetails.videoUrl,
                            duration: item.content[0].videoDetails.duration
                        }
                    };
                    extractedData.push(extractedItem);
                }
            });
            videosBatchPage++;
        }
        const extractedJson = {
            data: extractedData
        };
        return extractedJson;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error; // Re-throw the error to indicate failure
    }
}


export async function notesBatch(token, programId, subjectIdSlug, chapterIdSlug, topicId, page = 1, retryCount = 3) {
    const subTopicId = await getSlug(token, programId, subjectIdSlug, chapterIdSlug, topicId, 'Notes');
    let videosBatchPage = 1;
    const extractedData = [];
    try {
        while (true) {
            const url = `https://api.penpencil.co/v2/programs/contents?programId=${programId}&subjectId=${subjectIdSlug}&chapterId=${chapterIdSlug}&topicId=${topicId}&subTopicId=${subTopicId}&page=${videosBatchPage}`;
            const headers = {
                'Authorization': `Bearer ${token}`,
                'randomid': 'c818e543-8bdd-4207-86f0-717f922a2eaa',
                'Client-Id': '5eb393ee95fab7468a79d189'
            };
            const response = await fetch(url, { headers });
            if (!response.ok) {
                const status = response.status;
                if (status === 429 && retryCount > 0) {
                    console.warn(`Received 429 status, retrying... (Attempts left: ${retryCount})`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    // Retry the request
                    return await notesBatch(token, programId, subjectIdSlug, chapterIdSlug, topicId, page, retryCount - 1);
                } else {
                    throw new Error(`HTTP error! status: ${status}`);
                }
            }
            const data = await response.json();
            if (!(data && data.data && data.data.length >= 1)) {
                break;
            }
            data.data.forEach(item => {
                if (item.content[0]) {
                    const extractedItem = {
                        topic: item.text,
                        date: item.content[0].fileId.createdAt,
                        noteDetails: {
                            name: item.content[0].fileId.name,
                            noteUrl: item.content[0].fileId.baseUrl + item.content[0].fileId.key,
                            duration: item.content[0].fileId.duration
                        }
                    };
                    extractedData.push(extractedItem);
                }
            });
            videosBatchPage++;
        }
        const extractedJson = {
            data: extractedData
        };
        return extractedJson;
    } catch (error) {
        console.error('Error fetching data:', error.message);
        throw error;
    }
}


