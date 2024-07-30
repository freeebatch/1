import express from 'express';
const router = express.Router();
import { paidBatches, freeBatches, specificeBatch, subjectListDetails, videosBatch, videoNotes, dppQuestions, dppVideos } from '../controllers/pw.js';
// Your main file
import { findKey, findKey2 } from '../controllers/keyFinder.js';
import authLogin from '../middlewares/auth.js';
import { saveDataToMongoDB, saveAllDataToMongoDB, saveChapterData } from '../controllers/saveBatch.js';
// import saveDataToMongoDB from '../controllers/new.js';
import updateDataToMongoDB from '../controllers/updateBatch.js'
import { Batch, Subject, Chapter, Video, Note, Token } from '../models/batches.js'
import { convertMPDToHLS, multiQualityHLS } from '../controllers/hls.js'


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Kuch nahi Yrr' });
});

router.get('/logout', function (req, res, next) {
  const token = req.cookies.token;
  if (token) {
    res.cookie('token', 'logout', { maxAge: 604800000, httpOnly: true });
  }
  res.redirect('/login');
});

router.get('/login', function (req, res, next) {
  res.render('login');
});

router.post('/login', async function (req, res, next) {
  const token = req.body.token;
  if (!token) res.send("<script>alert('Please Enter Token'); window.location.href='/login';</script>");
  const url = 'https://api.penpencil.co/v3/oauth/verify-token';
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    "Accept": "application/json, text/plain, */*",
    "randomId": "344163b-ebef-ace-8fa-2a1c8863fd5a"
  };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers
    });
    const data = await response.json();
    if (data.success) {
      res.cookie('token', token, { maxAge: 604800000, httpOnly: true });
      res.redirect('/batches');
    } else {
      res.send("<script>alert('Token Expried'); window.location.href='/login';</script>");
      res.redirect('/login');
    }
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
});


router.get('/batches', authLogin, async function (req, res, next) {
  const token = req.cookies.token;
  saveAllDataToMongoDB(token)
  const paidBatch = await paidBatches(token)
  const freeBatch = await freeBatches(token)
  res.render('batch', { paidBatch, freeBatch });
});

router.get('/batches/save/:batchSlug', authLogin, async function (req, res, next) {
  const token = req.cookies.token;
  const batchSlug = req.params.batchSlug;
  await saveDataToMongoDB(token, batchSlug);
  res.send('Saved')
});

router.get('/batches/update/:batchSlug', authLogin, async function (req, res, next) {
  const token = req.cookies.token;
  const batchSlug = req.params.batchSlug;
  await updateDataToMongoDB(token, batchSlug);
  res.send('Updated')
});

router.get('/batches/:batchNameSlug/details', authLogin, async function (req, res, next) {
  const token = req.cookies.token;
  const specificeBatchdata = await specificeBatch(token, req.params.batchNameSlug)
  res.render('batchesDetails', { specificeBatch: specificeBatchdata, batchNameSlug: req.params.batchNameSlug });
});

router.get('/batches/:batchNameSlug/subject/:subjectSlug/topics', authLogin, async function (req, res, next) {
  const token = req.cookies.token;
  const subjectListDetailsData = await subjectListDetails(token, req.params.batchNameSlug, req.params.subjectSlug)
  res.render('subjectListDetails', { subjectListDetails: subjectListDetailsData, batchNameSlug: req.params.batchNameSlug, subjectSlug: req.params.subjectSlug });
});

router.get('/batches/:batchNameSlug/subject/:subjectSlug/topics/save', authLogin, async function (req, res, next) {
  const token = req.cookies.token;
  await saveChapterData(token, req.params.batchNameSlug, req.params.subjectSlug, 1)
  res.status(200).send('Saved');
});

router.get('/batches/:batchNameSlug/subject/:subjectSlug/contents/:chapterSlug', authLogin, async function (req, res, next) {
  const token = req.cookies.token;
  const videosBatchData = await videosBatch(token, req.params.batchNameSlug, req.params.subjectSlug, req.params.chapterSlug)
  res.render('videosBatch', { videosBatch: videosBatchData, batchNameSlug: req.params.batchNameSlug, subjectSlug: req.params.subjectSlug, chapterSlug: req.params.chapterSlug });
});

router.get('/batches/:batchNameSlug/subject/:subjectSlug/contents/:chapterSlug/:contentType', authLogin, async function (req, res, next) {
  const token = req.cookies.token;
  const contentType = req.params.contentType;
  switch (contentType) {
    case "lectures":
      const videosBatchData = await videosBatch(token, req.params.batchNameSlug, req.params.subjectSlug, req.params.chapterSlug)
      return res.status(200).json(videosBatchData);
      break;
    case "notes":
      const videoNotesData = await videoNotes(token, req.params.batchNameSlug, req.params.subjectSlug, req.params.chapterSlug)
      return res.status(200).json(videoNotesData);
      break;
    case "dpp":
      const dppQuestionsData = await dppQuestions(token, req.params.batchNameSlug, req.params.subjectSlug, req.params.chapterSlug)
      return res.status(200).json(dppQuestionsData);
      break;
    case "dppVideos":
      const dppVideosData = await dppVideos(token, req.params.batchNameSlug, req.params.subjectSlug, req.params.chapterSlug)
      return res.status(200).json(dppVideosData);
      break;

    default:
      break;
  }
  const videosBatchData = await videosBatch(token, req.params.batchNameSlug, req.params.subjectSlug, req.params.chapterSlug)
  return res.render('videosBatch', { videosBatch: videosBatchData });
});


router.get('/hls', async function (req, res, next) {
  try {
    const vidID = req.query.v;
    const quality = req.query.quality;
    const data = await convertMPDToHLS(vidID, quality)
    if (!data) { return res.status(403).send("Token Expired Change it!"); }
    res.setHeader('Content-Type', 'application/x-mpegurl; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="main.m3u8"');
    res.send(data);

  } catch (error) {
    res.status(403).send("HLS Error: " + error.message);
  }
})

router.get('/download/:vidID/master.m3u8', async function (req, res, next) {
  try {
    const vidID = req.params.vidID;
    const data = await multiQualityHLS(vidID);

    res.setHeader('Content-Type', 'application/x-mpegurl; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="PKV_play.m3u8"');

    res.send(data);
  } catch (error) {
    res.status(403).send("HLS Error: " + error.message);
  }
});

router.get('/get-hls-key', async (req, res) => {
  let db = await Token.findOne();
  const token = db.access_token;
  const videoKey = req.query.videoKey;
  const url = `https://api.penpencil.co/v1/videos/get-hls-key?videoKey=${videoKey}&key=enc.key&authorization=${token}`;

  try {
    const response = await fetch(url);
    const data = await response.arrayBuffer();  // Use arrayBuffer() for binary data
    res.setHeader('Content-Type', 'application/octet-stream');  // Set correct MIME type for binary data
    res.send(Buffer.from(data));  // Convert ArrayBuffer to Buffer
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred');
  }
});

router.get('/dash/:vidId/hls/:quality/:ts', async (req, res) => {
  const policy = req.query.Policy;
  const keyPairId = req.query['Key-Pair-Id'];
  const Signature = req.query.Signature;
  const vidId = req.params.vidId
  const quality = req.params.quality
  const ts = req.params.ts
  
  const url = `https://sec1.pw.live/${vidId}/hls/${quality}/${ts}?Policy=${policy}&Key-Pair-Id=${keyPairId}&Signature=${Signature}`
  try {
    const response = await fetch(url);
    const data = await response.arrayBuffer();  // Use arrayBuffer() for binary data
    res.setHeader('Content-Type', 'application/octet-stream');  // Set correct MIME type for binary data
    res.send(Buffer.from(data));  // Convert ArrayBuffer to Buffer
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('An error occurred');
  }
});


router.get('/play', async function (req, res, next) {
  let videoUrl = req.query.videoUrl;
  try {
    let key = null;
    if (key && key.kid && key.k) {
      res.render('player', { videoUrl, key });
    } else {
      res.render('player3', { videoUrl })
    }
  } catch (error) {
    res.status(403).send("Server Error: " + error.message);
  }
});


router.get('/saved/Batches', async function (req, res, next) {
  const batch = await Batch.find().select('-subjects');
  res.render('savedBatch', { batch });
});
router.get('/saved/batches/:batchNameSlug/details', async function (req, res, next) {
  const specificeBatchdata = await Batch.findOne({ slug: req.params.batchNameSlug }).select('-subjects.chapters');
  res.render('savedBatchesDetails', { specificeBatch: specificeBatchdata, batchNameSlug: req.params.batchNameSlug });
});
router.get('/saved/batches/:batchNameSlug/subject/:subjectSlug/topics', async function (req, res, next) {
  const batch = await Batch.findOne({ slug: req.params.batchNameSlug }).select('-subjects.chapters.videosSch -subjects.chapters.notesSch -subjects.chapters.dppVideosSch -subjects.chapters.dppSch');
  if (batch) {
    const subjectListDetailsData = batch.subjects.find(sub => sub.slug === req.params.subjectSlug);
    res.render('savedSubjectListDetails', { subjectListDetails: subjectListDetailsData, batchNameSlug: req.params.batchNameSlug, subjectSlug: req.params.subjectSlug });
  } else {
    res.status(404).json({ message: "Batch not found" });
  }
});
router.get('/saved/batches/:batchNameSlug/subject/:subjectSlug/contents/:chapterSlug', async function (req, res, next) {
  const batch = await Batch.findOne({ slug: req.params.batchNameSlug });
  const subjectListDetailsData = batch.subjects.find(sub => sub.slug === req.params.subjectSlug);
  const videosBatchData = subjectListDetailsData.chapters.find(sub => sub.slug === req.params.chapterSlug);
  // const videosBatchData = await videosBatch(token, req.params.batchNameSlug, req.params.subjectSlug, req.params.chapterSlug)
  res.render('savedVideosBatch', { videosBatch: videosBatchData, batchNameSlug: req.params.batchNameSlug, subjectSlug: req.params.subjectSlug, chapterSlug: req.params.chapterSlug });
});

router.get('/saved/batches/:batchNameSlug/subject/:subjectSlug/contents/:chapterSlug/:contentType', async function (req, res, next) {
  const batch = await Batch.findOne({ slug: req.params.batchNameSlug });
  const subjectListDetailsData = batch.subjects.find(sub => sub.slug === req.params.subjectSlug);
  const videosBatchData = subjectListDetailsData.chapters.find(sub => sub.slug === req.params.chapterSlug);
  res.json(videosBatchData)
});


router.get("/token/update", async (req, res) => {
  res.render('updateToken')
});

router.post("/token/update", async (req, res) => {
  const { access_token, refresh_token } = req.body;

  if (!access_token || !refresh_token) {
    return res.status(400).json({ error: "access_token and refresh_token are required" });
  }

  try {
    let token = await Token.findOne();
    if (token) {
      token.access_token = access_token;
      token.refresh_token = refresh_token;
    } else {
      token = new Token({ access_token, refresh_token });
    }
    await token.save();
    res.status(200).json({ message: "Token saved/updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while saving/updating the token" });
  }
});

router.get("/redirect-to-vlc", async (req, res) => {
  const vidID = req.query.v;
  const quality = req.query.quality;
  res.render('redirectToVlc', { vidID, quality })
});



export default router;
