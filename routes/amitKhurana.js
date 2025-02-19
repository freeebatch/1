import express from 'express';
import { cn, dm, os, dl, toc } from '../utils/amitKhuranaVideosData.js'

const router = express.Router();

router.get('/', (req, res) => {
    res.render('amitKhurana/subjects');
});

router.get('/subject/:subject', (req, res) => {
    let data = [];
    if (req.params.subject === 'cn') data = cn;
    else if (req.params.subject === 'dm') data = dm;
    else if (req.params.subject === 'os') data = os;
    else if (req.params.subject === 'dl') data = dl;
    else if (req.params.subject === 'toc') data = toc;
    if (data.length === 0) {
        return res.status(404).send("Subject not found");
    }
    res.render('amitKhurana/videos', { data, subject: req.params.subject });
});

router.get('/player/:subject/:id', (req, res) => {
    const subject = req.params.subject;
    const id = req.params.id;
    let course = '';

    // Find the course with the matching ID
    if (subject === 'cn') course = cn.find(course => course.id.toString() === id);
    else if (subject === 'dm') course = dm.find(course => course.id.toString() === id);
    else if (subject === 'os') course = os.find(course => course.id.toString() === id);
    else if (subject === 'dl') course = dl.find(course => course.id.toString() === id);
    else if (subject === 'toc') course = toc.find(course => course.id.toString() === id);


    if (course) {
        return res.render('amitKhurana/player', { url: course.url, subject });
    } else {
        return res.status(404).send("Course not found");
    }
});




export default router;