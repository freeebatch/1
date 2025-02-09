import express from 'express';
const router = express.Router();
import { Batch, Subject, Chapter, Video, Note, Token } from '../models/batches.js'


router.get('/batches', async function (req, res, next) {
    const batch = await Batch.find().select('-subjects -byName -language -__v -token');
    res.json(batch);
});
// parakram-gate-2024-computer-science-weekday--hinglish--613873
router.get('/batches/:batchNameSlug/details', async function (req, res, next) {
    const specificeBatchdata = await Batch.findOne({ slug: req.params.batchNameSlug }).select('-subjects.chapters');
    const subjects = specificeBatchdata.subjects
    res.json({ subjects: subjects });
});
// computer-networks-417461
router.get('/batches/:batchNameSlug/subject/:subjectSlug/topics', async function (req, res, next) {
    const batch = await Batch.findOne({ slug: req.params.batchNameSlug }).select('-subjects.chapters.typeId -subjects.chapters.videosSch -subjects.chapters.notesSch -subjects.chapters.dppVideosSch -subjects.chapters.dppSch');
    if (batch) {
        const subjectListDetailsData = batch.subjects.find(sub => sub.slug === req.params.subjectSlug);
        const chapters = subjectListDetailsData.chapters
        res.json({ chapters });
    } else {
        res.status(404).json({ message: "Batch not found" });
    }
});
// ch-01---ipv4-addressing-029458

router.get('/batches/:batchNameSlug/subject/:subjectSlug/contents/:chapterSlug/', async function (req, res, next) {
    const batch = await Batch.findOne({ slug: req.params.batchNameSlug });
    const subjectListDetailsData = batch.subjects.find(sub => sub.slug === req.params.subjectSlug);
    const videosBatchData = subjectListDetailsData.chapters.find(sub => sub.slug === req.params.chapterSlug);
    res.json(videosBatchData)
});


export default router;