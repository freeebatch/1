import { Batch, Subject, Chapter, Video, Note } from '../models/batches.js'
import { paidBatches, freeBatches, specificeBatch, subjectListDetails, videosBatch, videoNotes, dppQuestions, dppVideos } from './pw.js';
// import findKey from './keyFinder.js';

async function updateDataToMongoDB(token, batchSlug) {
    try {
        // Check if the batch already exists
        let batch = await Batch.findOne({ slug: batchSlug });

        if (batch) {
            console.log('Batch Already Exist!!');
            await updateBatchData(token, batchSlug);
        }

        console.log('All data saved successfully.');
    } catch (error) {
        console.error('Error saving data:', error.message);
    }
}

async function updateBatchData(token, batchSlug) {
    try {
        // Fetch batch data
        const batchData = await paidBatches(token);
        const batch = await Batch.findOneAndUpdate({ slug: batchSlug }, {
            name: batchData.name,
            byName: batchData.byName,
            language: batchData.language,
            previewImage: batchData.previewImage,
            slug: batchData.slug
        }, { new: true });

        // Fetch and update subject data for existing batch
        await updateSubjectData(token, batchSlug);

        console.log('Batch data updated successfully.');
    } catch (error) {
        console.error('Error updating batch data:', error.message);
    }
}

async function updateSubjectData(token, batchSlug) {
    try {
        // Fetch subject data for the given batch
        const subjectData = await specificeBatch(token, batchSlug);
        const batch = await Batch.findOne({ slug: batchSlug });

        // Update subject data under the batch
        subjectData.data.subjects.forEach(async subject => {
            let existingSubject = batch.subjects.find(sub => sub.slug === subject.slug);
            if (existingSubject) {
                // If subject exists, update it
                existingSubject.subject = subject.subject;
                existingSubject.imageId = subject.imageId;
            } else {
                // If subject doesn't exist, add it
                batch.subjects.push({
                    subject: subject.subject,
                    imageId: subject.imageId,
                    slug: subject.slug
                });
            }
        });

        await batch.save();
        console.log('Subject data updated successfully.');

        // Fetch and update chapter data for each subject
        for (const subject of subjectData.data.subjects) {
            await updateChapterData(token, batchSlug, subject.slug);
        }
    } catch (error) {
        console.error('Error updating subject data:', error.message);
    }
}

async function updateChapterData(token, batchSlug, subjectSlug) {
    try {
        // Fetch chapter data for the given subject
        const chapterData = await subjectListDetails(token, batchSlug, subjectSlug);
        const batch = await Batch.findOne({ slug: batchSlug });
        const subject = batch.subjects.find(sub => sub.slug === subjectSlug);

        // Update chapter data under the subject
        chapterData.data.forEach(async chapter => {
            let existingChapter = subject.chapters.find(chap => chap.slug === chapter.slug);
            if (existingChapter) {
                // If chapter exists, update it
                existingChapter.name = chapter.name;
                existingChapter.type = chapter.type;
                existingChapter.typeId = chapter.typeId;
                existingChapter.displayOrder = chapter.displayOrder;
                existingChapter.notes = chapter.notes;
                existingChapter.exercises = chapter.exercises;
                existingChapter.videos = chapter.videos;
            } else {
                // If chapter doesn't exist, add it
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
        });

        await batch.save();
        console.log('Chapter data updated successfully.');

        // Fetch and update video and notes data for each chapter
        for (const chapter of chapterData.data) {
            await updateVideoData(token, batchSlug, subjectSlug, chapter.slug);
            await updateNotesData(token, batchSlug, subjectSlug, chapter.slug);
            await updateDppsData(token, batchSlug, subjectSlug, chapter.slug);
            await updateDppVideoData(token, batchSlug, subjectSlug, chapter.slug);
        }
    } catch (error) {
        console.error('Error updating chapter data:', error.message);
    }
}

async function updateVideoData(token, batchSlug, subjectSlug, chapterSlug) {
    try {
        // Fetch video data for the given chapter
        const videoData = await videosBatch(token, batchSlug, subjectSlug, chapterSlug);
        const batch = await Batch.findOne({ slug: batchSlug });
        const subject = batch.subjects.find(sub => sub.slug === subjectSlug);
        const chapter = subject.chapters.find(chap => chap.slug === chapterSlug);

        // Update video data under the chapter
        videoData.data.forEach(async video => {
            let existingVideo = chapter.videosSch.find(vid => vid.topic === video.topic);
            if (existingVideo) {
                // If video exists, update it
                existingVideo.date = video.date;
                existingVideo.videoDetails.name = video.videoDetails.name;
                existingVideo.videoDetails.image = video.videoDetails.image;
                existingVideo.videoDetails.videoUrl = video.videoDetails.videoUrl;
                existingVideo.videoDetails.duration = video.videoDetails.duration;
            } else {
                // If video doesn't exist, add it
                chapter.videosSch.push({
                    topic: video.topic,
                    date: video.date,
                    videoDetails: {
                        name: video.videoDetails.name,
                        image: video.videoDetails.image,
                        videoUrl: video.videoDetails.videoUrl,
                        duration: video.videoDetails.duration
                    }
                });
            }
        });

        await batch.save();
        console.log('Video data updated successfully.');
    } catch (error) {
        console.error('Error updating video data:', error.message);
    }
}

async function updateNotesData(token, batchSlug, subjectSlug, chapterSlug) {
    try {
        // Fetch notes data for the given chapter
        const notesData = await videoNotes(token, batchSlug, subjectSlug, chapterSlug);
        const batch = await Batch.findOne({ slug: batchSlug });
        const subject = batch.subjects.find(sub => sub.slug === subjectSlug);
        const chapter = subject.chapters.find(chap => chap.slug === chapterSlug);

        // Update notes data under the chapter
        notesData.data.forEach(async note => {
            let existingNote = chapter.notesSch.find(n => n.topic === note.topic);
            if (existingNote) {
                // If note exists, update it
                existingNote.note = note.note;
                existingNote.pdfName = note.pdfName;
                existingNote.pdfUrl = note.pdfUrl;
            } else {
                // If note doesn't exist, add it
                chapter.notesSch.push({
                    topic: note.topic,
                    note: note.note,
                    pdfName: note.pdfName,
                    pdfUrl: note.pdfUrl
                });
            }
        });

        await batch.save();
        console.log('Notes data updated successfully.');
    } catch (error) {
        console.error('Error updating notes data:', error.message);
    }
}

async function updateDppsData(token, batchSlug, subjectSlug, chapterSlug) {
    try {
        // Fetch DPPs data for the given chapter
        const dppData = await dppQuestions(token, batchSlug, subjectSlug, chapterSlug);
        const batch = await Batch.findOne({ slug: batchSlug });
        const subject = batch.subjects.find(sub => sub.slug === subjectSlug);
        const chapter = subject.chapters.find(chap => chap.slug === chapterSlug);

        // Update DPPs data under the chapter
        dppData.data.forEach(async dpp => {
            let existingDpp = chapter.dppSch.find(d => d.topic === dpp.topic);
            if (existingDpp) {
                // If DPP exists, update it
                existingDpp.note = dpp.note;
                existingDpp.pdfName = dpp.pdfName;
                existingDpp.pdfUrl = dpp.pdfUrl;
            } else {
                // If DPP doesn't exist, add it
                chapter.dppSch.push({
                    topic: dpp.topic,
                    note: dpp.note,
                    pdfName: dpp.pdfName,
                    pdfUrl: dpp.pdfUrl
                });
            }
        });

        await batch.save();
        console.log('DPPs data updated successfully.');
    } catch (error) {
        console.error('Error updating DPPs data:', error.message);
    }
}

async function updateDppVideoData(token, batchSlug, subjectSlug, chapterSlug) {
    try {
        // Fetch DPP video data for the given chapter
        const dppVideoData = await dppVideos(token, batchSlug, subjectSlug, chapterSlug);
        const batch = await Batch.findOne({ slug: batchSlug });
        const subject = batch.subjects.find(sub => sub.slug === subjectSlug);
        const chapter = subject.chapters.find(chap => chap.slug === chapterSlug);

        // Update DPP video data under the chapter
        dppVideoData.data.forEach(async video => {
            let existingVideo = chapter.dppVideosSch.find(vid => vid.topic === video.topic);
            if (existingVideo) {
                // If video exists, update it
                existingVideo.date = video.date;
                existingVideo.videoDetails.name = video.videoDetails.name;
                existingVideo.videoDetails.image = video.videoDetails.image;
                existingVideo.videoDetails.videoUrl = video.videoDetails.videoUrl;
                existingVideo.videoDetails.duration = video.videoDetails.duration;
            } else {
                // If video doesn't exist, add it
                chapter.dppVideosSch.push({
                    topic: video.topic,
                    date: video.date,
                    videoDetails: {
                        name: video.videoDetails.name,
                        image: video.videoDetails.image,
                        videoUrl: video.videoDetails.videoUrl,
                        duration: video.videoDetails.duration
                    }
                });
            }
        });

        await batch.save();
        console.log('DPP video data updated successfully.');
    } catch (error) {
        console.error('Error updating DPP video data:', error.message);
    }
}

export default updateDataToMongoDB;
