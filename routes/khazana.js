import express from 'express';
import authLogin from "../middlewares/auth.js";
import { notesBatch, paidBatches, subjects, topics, videosBatch } from "../controllers/khazana.js"
import { saveDataToMongoDBKhazana } from '../controllers/saveKhazana.js';
import {Batch} from '../models/khazana.js'

const router = express.Router();

router.get('/', function (req, res, next) {
    res.send({ title: 'Kuch nahi Yrr' });
}); 


router.get('/batches', authLogin, async function (req, res, next) {
    const token = req.cookies.token;
    const paidBatch = await paidBatches(token)

    res.render('khazana/batch', { paidBatch });
});
// 653543ca81e74c00187aff4e
router.get('/programs/:khazanaProgramId', authLogin, async function (req, res, next) {
    const token = req.cookies.token;
    const khazanaProgramId = req.params.khazanaProgramId
    const subject = await subjects(token, khazanaProgramId)

    // res.send(subject);
    res.render('khazana/batchesDetails', { specificeBatch:subject, khazanaProgramId });
});

router.get('/programs/:khazanaProgramId/save', authLogin, async function (req, res, next) {
    const token = req.cookies.token;
    const khazanaProgramId = req.params.khazanaProgramId

    await saveDataToMongoDBKhazana(token, khazanaProgramId);
    res.send('Saved')
});

router.get('/programs/:khazanaProgramId/get', authLogin, async function (req, res, next) {
    const token = req.cookies.token;
    const khazanaProgramId = req.params.khazanaProgramId
    const batch = await Batch.find({khazanaProgramId: khazanaProgramId})

    res.send(batch)
});
router.get('/programs/:khazanaProgramId/delete', authLogin, async function (req, res, next) {
    const token = req.cookies.token;
    const khazanaProgramId = req.params.khazanaProgramId
    const batch = await Batch.findOneAndDelete({khazanaProgramId: khazanaProgramId})

    res.send("Deleted")
});

router.get('/programs/:khazanaProgramId/subjects/:slugT/chapters/:slugC/topics/', authLogin, async function (req, res, next) {
    const token = req.cookies.token;
    const khazanaProgramId = req.params.khazanaProgramId
    const slugT = req.params.slugT
    const slugC = req.params.slugC

    const topic = await topics(token, khazanaProgramId, slugT, slugC)
    // res.send(topic);
    res.render('khazana/chapters', { subjectListDetails:topic , khazanaProgramId, slugT, slugC });
});

router.get('/programs/:khazanaProgramId/subjects/:slugT/chapters/:slugC/topics/:topics/videos/', authLogin, async function (req, res, next) {
    const token = req.cookies.token;
    const khazanaProgramId = req.params.khazanaProgramId
    const slugT = req.params.slugT
    const slugC = req.params.slugC
    const topics = req.params.topics
    const video = await videosBatch(token, khazanaProgramId, slugT, slugC, topics)
    const note = await notesBatch(token, khazanaProgramId, slugT, slugC, topics)
    // res.send({video, note});
    res.render('khazana/videos', { videosBatch:video, notesBatch:note,  khazanaProgramId, slugT, slugC });
});




router.get('/saved/batches', async function (req, res, next) {
    const batch = await Batch.find().select('-subjects -token');
    // res.send(batch);

    res.render('khazana/savedBatch', { data:batch });
});
// 653543ca81e74c00187aff4e
router.get('/saved/programs/:khazanaProgramId', async function (req, res, next) {
    const khazanaProgramId = req.params.khazanaProgramId

    const batch = await Batch.findOne({khazanaProgramId:khazanaProgramId});
    const subject = batch.subjects

    // res.send(subject);
    res.render('khazana/savedBatchesDetails', { data:subject, khazanaProgramId });
});

router.get('/saved/programs/:khazanaProgramId/delete', async function (req, res, next) {
    const khazanaProgramId = req.params.khazanaProgramId
    const batch = await Batch.findOneAndDelete({khazanaProgramId: khazanaProgramId})

    res.send("Deleted", batch)
});

router.get('/saved/programs/:khazanaProgramId/subjects/:slugT/chapters/:slugC/topics/', async function (req, res, next) {
    const khazanaProgramId = req.params.khazanaProgramId
    const slugT = req.params.slugT
    const slugC = req.params.slugC

    const batch = await Batch.findOne({khazanaProgramId:khazanaProgramId});
    const subject = batch.subjects.find(sub => sub.slug === slugT);
    const topic = subject.chapters.find(sub => sub.slug === slugC);

    // res.send(topic);
    res.render('khazana/savedChapters', { subjectListDetails:topic.topicSchema , khazanaProgramId, slugT, slugC });
});

router.get('/saved/programs/:khazanaProgramId/subjects/:slugT/chapters/:slugC/topics/:topics/videos/', async function (req, res, next) {
    const khazanaProgramId = req.params.khazanaProgramId
    const slugT = req.params.slugT
    const slugC = req.params.slugC
    const topicId = req.params.topics

    const batch = await Batch.findOne({khazanaProgramId:khazanaProgramId});
    const subject = batch.subjects.find(sub => sub.slug === slugT);
    const topic = subject.chapters.find(sub => sub.slug === slugC);

    const video = topic.topicSchema.find(sub => sub.topicId === topicId).videosSch;
    const note = topic.topicSchema.find(sub => sub.topicId === topicId).notesSch;

    // res.send({video, note});
    res.render('khazana/savedVideos', { videosBatch:video, notesBatch:note,  khazanaProgramId, slugT, slugC });
});

export default router;