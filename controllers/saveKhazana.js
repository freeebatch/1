// import { Batch, Subject, Chapter, Video, Note } from '../models/batches.js'
import {Batch} from '../models/khazana.js'
import {notesBatch, videosBatch, paidBatches, subjects, topics} from './khazana.js'

async function saveDataToMongoDBKhazana(token, khazanaProgramId) {
    try {
        const batch = await Batch.findOne({ khazanaProgramId: khazanaProgramId });
        if (batch) {
            console.log('Batch Already Exist!!');
            return;
        }

        // Fetch batch data
        let batchData = await paidBatches(token);
        batchData.data.forEach(async course => {
            if (course.khazanaProgramId == khazanaProgramId) {
                await saveBatchData(course, token);
            }
        });


        // Fetch and save subject data for each batch
        await saveSubjectData(token, khazanaProgramId);
        console.log('Batch Saved :- ', course.name);

        console.log('All data saved successfully.');
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
            khazanaProgramId: batchData.khazanaProgramId,
            slug: batchData.slug,
            token: token
        });
        await batch.save();
        // console.log('Batch data saved successfully.', batch);
    } catch (error) {
        console.error('Error saving batch data:', error.message);
    }
}

async function saveSubjectData(token, khazanaProgramId) {
    try {
        // Fetch subject data for the given batch
        const subjectData = await subjects(token, khazanaProgramId);

        // Find the batch based on khazanaProgramId
        const batch = await Batch.findOne({ khazanaProgramId });
        if (!batch) {
            console.error('Batch not found');
            return;
        }

        // Save subject data under the batch
        for (const subject of subjectData.data) {
            const newSubject = {
                name: subject.name,
                slug: subject.slug,
                chapters: subject.chapters.map(chapter => ({
                    name: chapter.name,
                    organizationId: chapter.organizationId,
                    programId: chapter.programId,
                    subjectId: chapter.subjectId,
                    slug: chapter.slug,
                    previewImage: chapter.previewImage
                }))
            };

            batch.subjects.push(newSubject);
        }

        await batch.save();
        console.log('Subject data saved successfully.');

        // Fetch and save chapter data for each subject and chapter
        for (const subject of subjectData.data) {
            for (const chapter of subject.chapters) {
                await saveTopicsData(token, khazanaProgramId, subject.slug, chapter.slug);
                console.log(`Subject: ${subject.name}, Chapter: ${chapter.name} saved`);
            }
        }
    } catch (error) {
        console.error('Error saving subject data:', error.message);
    }
}


async function saveTopicsData(token, khazanaProgramId, subjectSlug, chapterSlug) {
    try {

        const chapterData = await topics(token, khazanaProgramId, subjectSlug, chapterSlug);

        // Find the batch based on slug
        const batch = await Batch.findOne({ khazanaProgramId: khazanaProgramId });
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

        const chapter = subject.chapters.find(sub => sub.slug === chapterSlug);
        if (!chapter) {
            console.error('Chapter not found');
            return;
        }

        // Clear existing chapters in subject
        chapter.topicSchema = [];

        // Save topic data under the chapter
        for (const topic of chapterData) {
            chapter.topicSchema.push({
                name: topic.name,
                topicId: topic.topicId,
                totalLectures: topic.totalLectures,
                totalNotes: topic.totalNotes,
                totalExercises: topic.totalExercises
            });
        }
        await batch.save();
        console.log(`Topics saved for Chapter: ${chapter.name}`);

        // Fetch and save video and notes data for each topic
        for (const topic of chapterData) {
            await saveVideoData(token, khazanaProgramId, subjectSlug, chapterSlug, topic.topicId);
            await saveNotesData(token, khazanaProgramId, subjectSlug, chapterSlug, topic.topicId);
            console.log(`Video, Notes Saved: ${topic.name}`);
        }
    } catch (error) {
        console.error('Error saving chapter data:', error.message);
    }
}

async function saveVideoData(token, khazanaProgramId, subjectSlug, chapterSlug, topicId) {
    try {
        const videoData = await videosBatch(token, khazanaProgramId, subjectSlug, chapterSlug, topicId);

        const batch = await Batch.findOne({ khazanaProgramId: khazanaProgramId });
        if (!batch) return console.error('Batch not found');

        const subject = batch.subjects.find(sub => sub.slug === subjectSlug);
        if (!subject) return console.error('Subject not found');

        const chapter = subject.chapters.find(chap => chap.slug === chapterSlug);
        if (!chapter) return console.error('Chapter not found');

        const topic = chapter.topicSchema.find(top => top.topicId === topicId);
        if (!topic) return console.error('topic not found');

        if (!topic.videosSch) topic.videosSch = [];

        for (const video of videoData.data) {
            topic.videosSch.push({
                topic: video.topic,
                date: video.date,
                videoDetails: {
                    name: video.videoDetails.name,
                    image: video.videoDetails.image,
                    videoUrl: video.videoDetails.videoUrl,
                    duration: video.videoDetails.duration,
                }
            });
        }

        await batch.save();
        // console.log('Video data saved successfully.');
    } catch (error) {
        console.error('Error saving video data:', error.message);
    }
}


async function saveNotesData(token, khazanaProgramId, subjectSlug, chapterSlug, topicId) {
    try {
        const notesData = await notesBatch(token, khazanaProgramId, subjectSlug, chapterSlug, topicId);

        const batch = await Batch.findOne({ khazanaProgramId: khazanaProgramId });
        if (!batch) return console.error('Batch not found');

        const subject = batch.subjects.find(sub => sub.slug === subjectSlug);
        if (!subject) return console.error('Subject not found');

        const chapter = subject.chapters.find(chap => chap.slug === chapterSlug);
        if (!chapter) return console.error('Chapter not found');

        const topic = chapter.topicSchema.find(top => top.topicId === topicId);
        if (!topic) return console.error('topic not found');

        if (!topic.notesSch) topic.notesSch = [];

        for (const note of notesData.data) {
            topic.notesSch.push({
                topic: note.noteDetails.name,
                date: note.date,
                pdfUrl: note.noteDetails.noteUrl,
                pdfName: note.noteDetails.name,
            });
        }

        await batch.save();
        // console.log('Notes data saved successfully.');
    } catch (error) {
        console.error('Error saving notes data:', error.message);
    }
}



export { saveDataToMongoDBKhazana };
