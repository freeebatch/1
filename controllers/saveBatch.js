import { Batch, Subject, Chapter, Video, Note } from '../models/batches.js'
import { paidBatches, freeBatches, specificeBatch, subjectListDetails, videosBatch, videoNotes, dppQuestions, dppVideos } from './pw.js';

async function saveDataToMongoDB(token, batchSlug) {
    try {
        const batch = await Batch.findOne({ slug: batchSlug });
        if (batch) {
            console.log('Batch Already Exist!!');
            return;
        }

        // Fetch batch data
        let batchData = await paidBatches(token);
        batchData.data.forEach(async course => {
            if (course.slug == batchSlug) {
                await saveBatchData(course), token;
            }
        });

        batchData = await freeBatches(token);
        batchData.data.forEach(async course => {
            if (course.slug == batchSlug) {
                await saveBatchData(course, token);
            }
        });

        // Fetch and save subject data for each batch
        await saveSubjectData(token, batchSlug);
        console.log('Batch Saved :- ', course.name);

        console.log('All data saved successfully.');
    } catch (error) {
        console.error('Error saving data:', error.message);
    }
}

async function saveAllDataToMongoDB(token) {
    try {
        let batchData = await paidBatches(token);

        batchData.data.forEach(async course => {
            const batch = await Batch.findOne({ slug: course.slug });
            if (!batch) {
                await saveBatchData(course, token);
                await saveSubjectData(token, course.slug);
                console.log('Batch Saved :- ', course.name);
            }
            else {
                console.log('Batch Already Exist!!');
            }
        });

        console.log('All Batches are saved successfully.');
    } catch (error) {
        console.error('Error saving data:', error.message);
    }
}

async function saveBatchData(batchData, token) {
    try {
        const batch = new Batch({
            name: batchData.name,
            byName: batchData.byName,
            language: batchData.language,
            previewImage: batchData.previewImage,
            slug: batchData.slug,
            token: token
        });
        await batch.save();
    } catch (error) {
        console.error('Error saving batch data:', error.message);
    }
}

async function saveSubjectData(token, batchSlug) {
    try {
        // Fetch subject data for the given batch
        const subjectData = await specificeBatch(token, batchSlug);

        // Find the batch based on slug
        const batch = await Batch.findOne({ slug: batchSlug });
        if (!batch) {
            console.error('Batch not found');
            return;
        }

        // Save subject data under the batch
        for (const subject of subjectData.data.subjects) {
            batch.subjects.push({
                subject: subject.subject,
                imageId: subject.imageId,
                slug: subject.slug,
                tagCount: subject.tagCount
            });
        }

        await batch.save();
        console.log('Subject data saved successfully.');

        // Fetch and save chapter data for each subject
        for (const subject of subjectData.data.subjects) {
            await saveChapterData(token, batchSlug, subject.slug, subject.tagCount);
            console.log('Subject Saved', subject.subject);
        }
    } catch (error) {
        console.error('Error saving subject data:', error.message);
    }
}

async function saveChapterData(token, batchSlug, subjectSlug, tagCount) {
    try {

        const chapterData = await subjectListDetails(token, batchSlug, subjectSlug);

        // Find the batch based on slug
        const batch = await Batch.findOne({ slug: batchSlug });
        if (!batch) {
            console.error('Batch not found');
            return;
        }

        // Find the subject based on slug
        const subject = batch.subjects.find(sub => sub.slug === subjectSlug);
        if (!subject) {
            console.error('Subject not found');
            return;
        }

        // Clear existing chapters in subject
        subject.chapters = [];

        // Save chapter data under the subject
        for (const chapter of chapterData.data) {
            subject.chapters.push({
                name: chapter.name,
                type: chapter.type,
                typeId: chapter.typeId,
                displayOrder: chapter.displayOrder,
                notes: chapter.notes,
                exercises: chapter.exercises,
                videos: chapter.videos,
                slug: chapter.slug
            });
        }
        await batch.save();

        // Fetch and save video and notes data for each chapter
        for (const chapter of chapterData.data) {
            await saveVideoData(token, batchSlug, subjectSlug, chapter.slug);
            await saveNotesData(token, batchSlug, subjectSlug, chapter.slug);
            await saveDppsData(token, batchSlug, subjectSlug, chapter.slug);
            await saveDppVideoData(token, batchSlug, subjectSlug, chapter.slug);
            console.log("Chapter Saved ", chapter.name)
        }
    } catch (error) {
        console.error('Error saving chapter data:', error.message);
    }
}

async function saveVideoData(token, batchSlug, subjectSlug, chapterSlug) {
    try {
        // Fetch video data for the given chapter
        const videoData = await videosBatch(token, batchSlug, subjectSlug, chapterSlug);

        // Find the batch based on slug
        const batch = await Batch.findOne({ slug: batchSlug });
        if (!batch) {
            console.error('Batch not found');
            return;
        }

        // Find the subject based on slug
        const subject = batch.subjects.find(sub => sub.slug === subjectSlug);
        if (!subject) {
            console.error('Subject not found');
            return;
        }

        // Find the chapter based on slug
        const chapter = subject.chapters.find(chap => chap.slug === chapterSlug);
        if (!chapter) {
            console.error('Chapter not found');
            return;
        }

        // Save video data under the chapter
        for (const video of videoData.data) {
            let key = {
                kid: '',
                k: ''
            }

            chapter.videosSch.push({
                topic: video.topic,
                date: video.date,
                videoDetails: {
                    name: video.videoDetails.name,
                    image: video.videoDetails.image,
                    videoUrl: video.videoDetails.videoUrl,
                    duration: video.videoDetails.duration,
                    key: key
                }
            });
        }

        await batch.save();
        // console.log('Video data saved successfully.');
    } catch (error) {
        console.error('Error saving video data:', error.message);
    }
}

async function saveNotesData(token, batchSlug, subjectSlug, chapterSlug) {
    try {
        // Fetch notes data for the given chapter
        const notesData = await videoNotes(token, batchSlug, subjectSlug, chapterSlug);

        // Find the batch based on slug
        const batch = await Batch.findOne({ slug: batchSlug });
        if (!batch) {
            console.error('Batch not found');
            return;
        }

        // Find the subject based on slug
        const subject = batch.subjects.find(sub => sub.slug === subjectSlug);
        if (!subject) {
            console.error('Subject not found');
            return;
        }

        // Find the chapter based on slug
        const chapter = subject.chapters.find(chap => chap.slug === chapterSlug);
        if (!chapter) {
            console.error('Chapter not found');
            return;
        }

        // Save notes data under the chapter
        for (const note of notesData.data) {
            chapter.notesSch.push({
                topic: note.topic,
                note: note.note,
                pdfName: note.pdfName,
                pdfUrl: note.pdfUrl
            });
        }

        await batch.save();
        // console.log('Notes data saved successfully.');
    } catch (error) {
        console.error('Error saving notes data:', error.message);
    }
}

async function saveDppVideoData(token, batchSlug, subjectSlug, chapterSlug) {
    try {
        // Fetch video data for the given chapter
        const videoData = await dppVideos(token, batchSlug, subjectSlug, chapterSlug);

        // Find the batch based on slug
        const batch = await Batch.findOne({ slug: batchSlug });
        if (!batch) {
            console.error('Batch not found');
            return;
        }

        // Find the subject based on slug
        const subject = batch.subjects.find(sub => sub.slug === subjectSlug);
        if (!subject) {
            console.error('Subject not found');
            return;
        }

        // Find the chapter based on slug
        const chapter = subject.chapters.find(chap => chap.slug === chapterSlug);
        if (!chapter) {
            console.error('Chapter not found');
            return;
        }

        // Save video data under the chapter
        for (const video of videoData.data) {
            let key = {
                kid: '',
                k: ''
            }

            chapter.dppVideosSch.push({
                topic: video.topic,
                date: video.date,
                videoDetails: {
                    name: video.videoDetails.name,
                    image: video.videoDetails.image,
                    videoUrl: video.videoDetails.videoUrl,
                    duration: video.videoDetails.duration,
                    key: key
                }
            });
        }

        await batch.save();
        // console.log('DPP Video data saved successfully.');
    } catch (error) {
        console.error('Error saving DPP video data:', error.message);
    }
}

async function saveDppsData(token, batchSlug, subjectSlug, chapterSlug) {
    try {
        // Fetch notes data for the given chapter
        const notesData = await dppQuestions(token, batchSlug, subjectSlug, chapterSlug);

        // Find the batch based on slug
        const batch = await Batch.findOne({ slug: batchSlug });
        if (!batch) {
            console.error('Batch not found');
            return;
        }

        // Find the subject based on slug
        const subject = batch.subjects.find(sub => sub.slug === subjectSlug);
        if (!subject) {
            console.error('Subject not found');
            return;
        }

        // Find the chapter based on slug
        const chapter = subject.chapters.find(chap => chap.slug === chapterSlug);
        if (!chapter) {
            console.error('Chapter not found');
            return;
        }

        // Save notes data under the chapter
        for (const note of notesData.data) {
            chapter.dppSch.push({
                topic: note.topic,
                note: note.note,
                pdfName: note.pdfName,
                pdfUrl: note.pdfUrl
            });
        }

        await batch.save();
        // console.log('DPP data saved successfully.');
    } catch (error) {
        console.error('Error saving DPP data:', error.message);
    }
}

export { saveDataToMongoDB, saveAllDataToMongoDB, saveChapterData };
