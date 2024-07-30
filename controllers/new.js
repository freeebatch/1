import { Batch, Subject, Chapter, Video, Note, DppVideo, Dpp } from '../models/lala.js'
import { paidBatches, freeBatches, specificeBatch, subjectListDetails, videosBatch, videoNotes, dppQuestions, dppVideos } from './pw.js';


async function saveDataToMongoDB(token, batchSlug) {
    try {
        let batch = await Batch.findOne({ slug: batchSlug });
        console.log(batch)
        if (batch) {
            console.log('Batch Already Exist!!');
            return;
        }

        // Fetch batch data
        const batchData = await paidBatches(token);
        
        // Use for...of loop to iterate over batchData.data and await each saveBatchData call
        for (const course of batchData.data) {
            try {
                if (course.slug === batchSlug) {
                    await saveBatchData(course);
                }
            } catch (error) {
                console.error('Error saving batch data:', error.message);
            }
        }
        

        console.log('All data saved successfully.');
    } catch (error) {
        console.error('Error saving data:', error.message);
    }
}


async function saveBatchData(batchData, batchSlug) {
    try {
        for (const course of batchData.data) {
            if (course.slug === batchSlug) {
                const newBatch = new Batch({
                    name: course.name,
                    byName: course.byName,
                    language: course.language,
                    previewImage: course.previewImage,
                    slug: course.slug
                });
                await newBatch.save();
                console.log('Batch data saved successfully.');
                break;
            }
        }
    } catch (error) {
        console.error('Error saving batch data:', error.message);
    }
}

// Other save functions (saveSubjectData, saveChapterData, etc.) will also need adjustments accordingly
async function saveSubjectData(token, batchSlug) {
    try {
        const subjectData = await specificeBatch(token, batchSlug);
        let batch = await Batch.findOne({ slug: batchSlug });

        if (!batch) {
            console.error('Batch not found');
            return;
        }

        for (const subject of subjectData.data.subjects) {
            const newSubject = new Subject({
                subject: subject.subject,
                imageId: subject.imageId,
                slug: subject.slug
            });
            await newSubject.save();

            batch.subjects.push(newSubject._id); // Store the subject's _id in the batch's subjects array
        }

        await batch.save();
        console.log('Subject data saved successfully.');

        // Fetch and save chapter data for each subject
        for (const subject of subjectData.data.subjects) {
            await saveChapterData(token, batchSlug, subject.slug);
        }
    } catch (error) {
        console.error('Error saving subject data:', error.message);
    }
}

async function saveChapterData(token, batchSlug, subjectSlug) {
    try {
        const chapterData = await subjectListDetails(token, batchSlug, subjectSlug);
        const subject = await Subject.findOne({ slug: subjectSlug });

        if (!subject) {
            console.error('Subject not found');
            return;
        }

        for (const chapter of chapterData.data) {
            const newChapter = new Chapter({
                name: chapter.name,
                type: chapter.type,
                typeId: chapter.typeId,
                displayOrder: chapter.displayOrder,
                notes: chapter.notes,
                exercises: chapter.exercises,
                slug: chapter.slug
            });
            await newChapter.save();

            subject.chapters.push(newChapter._id); // Store the chapter's _id in the subject's chapters array
        }

        await subject.save();
        console.log('Chapter data saved successfully.');

        // Fetch and save video and notes data for each chapter
        for (const chapter of chapterData.data) {
            await saveVideoData(token, batchSlug, subjectSlug, chapter.slug);
            await saveNotesData(token, batchSlug, subjectSlug, chapter.slug);
            // Adjust as needed for other related data
        }
    } catch (error) {
        console.error('Error saving chapter data:', error.message);
    }
}

// Similar adjustments should be made to other save functions (saveVideoData, saveNotesData, etc.)
async function saveVideoData(token, batchSlug, subjectSlug, chapterSlug) {
    try {
        const videoData = await videosBatch(token, batchSlug, subjectSlug, chapterSlug);
        const chapter = await Chapter.findOne({ slug: chapterSlug });

        if (!chapter) {
            console.error('Chapter not found');
            return;
        }

        for (const video of videoData.data) {
            let key = {
                kid: '',
                k: ''
            };
            const newVideo = new Video({
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
            await newVideo.save();

            chapter.videos.push(newVideo._id); // Store the video's _id in the chapter's videos array
        }

        await chapter.save();
        console.log('Video data saved successfully.');
    } catch (error) {
        console.error('Error saving video data:', error.message);
    }
}

async function saveNotesData(token, batchSlug, subjectSlug, chapterSlug) {
    try {
        const notesData = await videoNotes(token, batchSlug, subjectSlug, chapterSlug);
        const chapter = await Chapter.findOne({ slug: chapterSlug });

        if (!chapter) {
            console.error('Chapter not found');
            return;
        }

        for (const note of notesData.data) {
            const newNote = new Note({
                topic: note.topic,
                note: note.note,
                pdfName: note.pdfName,
                pdfUrl: note.pdfUrl
            });
            await newNote.save();

            chapter.notes.push(newNote._id); // Store the note's _id in the chapter's notes array
        }

        await chapter.save();
        console.log('Notes data saved successfully.');
    } catch (error) {
        console.error('Error saving notes data:', error.message);
    }
}

// Adjust other save functions (saveDppsData, saveDppVideoData, etc.) similarly...
async function saveDppVideoData(token, batchSlug, subjectSlug, chapterSlug) {
    try {
        const videoData = await dppVideos(token, batchSlug, subjectSlug, chapterSlug);
        const chapter = await Chapter.findOne({ slug: chapterSlug });

        if (!chapter) {
            console.error('Chapter not found');
            return;
        }

        for (const video of videoData.data) {
            let key = {
                kid: '',
                k: ''
            };
            const newVideo = new DppVideo({
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
            await newVideo.save();

            chapter.dppVideos.push(newVideo._id); // Store the video's _id in the chapter's dppVideos array
        }

        await chapter.save();
        console.log('DPP Video data saved successfully.');
    } catch (error) {
        console.error('Error saving DPP video data:', error.message);
    }
}

async function saveDppsData(token, batchSlug, subjectSlug, chapterSlug) {
    try {
        const dppData = await dppQuestions(token, batchSlug, subjectSlug, chapterSlug);
        const chapter = await Chapter.findOne({ slug: chapterSlug });

        if (!chapter) {
            console.error('Chapter not found');
            return;
        }

        for (const dpp of dppData.data) {
            const newDpp = new Dpp({
                topic: dpp.topic,
                note: dpp.note,
                pdfName: dpp.pdfName,
                pdfUrl: dpp.pdfUrl
            });
            await newDpp.save();

            chapter.dpps.push(newDpp._id); // Store the dpp's _id in the chapter's dpps array
        }

        await chapter.save();
        console.log('DPP data saved successfully.');
    } catch (error) {
        console.error('Error saving DPP data:', error.message);
    }
}

export default saveDataToMongoDB;
