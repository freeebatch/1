import express from "express";
import { paidTest, paidTestAll, testInstructions, testQuestions } from "../controllers/test.js";
import authLogin from "../middlewares/auth.js";
import { saveTestToMongoDB } from "../controllers/saveTest.js";
import { Test } from "../models/test.js";
const router = express.Router();


// const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE3NDI0NDQ1NDkuOTMyLCJkYXRhIjp7Il9pZCI6IjY1OTU1MzJmNDMzM2I1MDAxODUxYjFkZSIsInVzZXJuYW1lIjoiNjIwNzgwOTU4OCIsImZpcnN0TmFtZSI6IkFrc2hhbnNoIiwibGFzdE5hbWUiOiJLdW1hciBUaXdhcmkiLCJvcmdhbml6YXRpb24iOnsiX2lkIjoiNWViMzkzZWU5NWZhYjc0NjhhNzlkMTg5Iiwid2Vic2l0ZSI6InBoeXNpY3N3YWxsYWguY29tIiwibmFtZSI6IlBoeXNpY3N3YWxsYWgifSwiZW1haWwiOiJha3NoYW5zaDg0NTQzMEBnbWFpbC5jb20iLCJyb2xlcyI6WyI1YjI3YmQ5NjU4NDJmOTUwYTc3OGM2ZWYiXSwiY291bnRyeUdyb3VwIjoiSU4iLCJ0eXBlIjoiVVNFUiJ9LCJpYXQiOjE3NDE4Mzk3NDl9.VTVZ69VSs8WSFwZhMSNGAxVuZQIZNkowkmYKmxuFlzM"



router.get('/', authLogin, async function (req, res, next) {
    const token = req.cookies.token;
    const tests = await paidTest(token);
    res.render('tests/tests', { tests: tests.data, saved:false });
    // res.json(test);
})
 
router.get('/test-service/categoryId/:categoryId/testModeId/:testModeId', authLogin, async function (req, res, next) {
    const token = req.cookies.token;
    const categoryId = req.params.categoryId;
    const testModeId = req.params.testModeId;

    const test = await paidTestAll(token, testModeId, categoryId);
    res.render('tests/testSubjects', { test:test.data, testModeId, categoryId, saved:false });
    // res.json(test);
})

router.get('/test-service/categoryId/:categoryId/testModeId/:testModeId/save', authLogin, async function (req, res, next) {
    const token = req.cookies.token;
    const categoryId = req.params.categoryId;
    const testModeId = req.params.testModeId;
    await saveTestToMongoDB(token, testModeId, categoryId);
    // const test = await paidTestAll(token, testModeId, categoryId);
    res.send("test Saved")  
})
router.get('/test-service/categoryId/:categoryId/testModeId/:testModeId/get', authLogin, async function (req, res, next) {
    const token = req.cookies.token;
    const categoryId = req.params.categoryId;
    const testModeId = req.params.testModeId;
    const test = await Test.findOne({categoryModeId: testModeId, $and: [{categoryId: categoryId}]}).exec();
    res.json(test)
})
router.get('/test-service/categoryId/:categoryId/testModeId/:testModeId/delete', authLogin, async function (req, res, next) {
    const token = req.cookies.token;
    const categoryId = req.params.categoryId;
    const testModeId = req.params.testModeId;
    await Test.findOneAndDelete({categoryModeId: testModeId, $and: [{categoryId: categoryId}]}).exec();
    res.send("test delete")
})

router.get('/test-service/:testId/instructions', authLogin, async function (req, res, next) {
    const token = req.cookies.token;
    const testId = req.params.testId;

    const test = await testInstructions(token, testId);
    res.render('tests/testInstruction', { test, saved:false });
    // res.json(test);
})

router.get('/test-service/:testId/categoryModeId/:categoryModeId/testStudentMappingId/:testStudentMappingId/questions', authLogin, async function (req, res, next) {
    const token = req.cookies.token;
    const testId = req.params.testId;
    const categoryModeId = req.params.categoryModeId;
    const testStudentMapping = req.params.testStudentMappingId;

    const test = await testQuestions(token, testId, categoryModeId, "Finished", testStudentMapping);
    res.render('tests/testQuestions', { data:test.data.data, saved:false });
    // res.json(test);
})


// Saved Data ---------------------------------------------------------------------
router.get('/saved', async function (req, res, next) {
    const tests = await Test.find().select("-subject");
    res.render('tests/tests', { tests, saved: true });
    // res.json(tests);
})
 
router.get('/saved/test-service/categoryId/:categoryId/testModeId/:testModeId', async function (req, res, next) {
    const categoryId = req.params.categoryId;
    const testModeId = req.params.testModeId;

    const test = await Test.findOne({categoryModeId: testModeId, $and: [{categoryId: categoryId}]}).select('-subject.instruction -subject.testQuestions').exec();
    const subject = test.subject;

    // const test = await paidTestAll(token, testModeId, categoryId);
    res.render('tests/testSubjects', { test:subject, testModeId, categoryId, saved: true });
    // res.json(subject);
})


router.get('/saved/test-service/categoryId/:categoryId/testModeId/:testModeId/get', async function (req, res, next) {
    const token = req.cookies.token;
    const categoryId = req.params.categoryId;
    const testModeId = req.params.testModeId;
    const test = await Test.findOne({categoryModeId: testModeId, $and: [{categoryId: categoryId}]}).exec();
    res.json(test)
})


// router.get('/saved/test-service/:testId/instructions', async function (req, res, next) {
router.get('/saved/test-service/:testId/categoryId/:categoryId/testModeId/:testModeId/instructions', async function (req, res, next) {
    const categoryId = req.params.categoryId;
    const testModeId = req.params.testModeId;

    const test = await Test.findOne({categoryModeId: testModeId, $and: [{categoryId: categoryId}]}).select('-subject.testQuestions').exec();
    const subject = test.subject;
    let instruction = ""
    for(const sub of subject) {
        if(sub.testId === req.params.testId) {
            instruction = JSON.parse(sub.instruction)
            break;
        }
    }

    // const test = await testInstructions(token, testId);
    res.render('tests/testInstruction', { test: instruction, saved: true });
    // res.json(test);
})

router.get('/saved/test-service/:testId/categoryId/:categoryId/testModeId/:testModeId/questions', async function (req, res, next) {
    const categoryId = req.params.categoryId;
    const testModeId = req.params.testModeId;

    const test = await Test.findOne({categoryModeId: testModeId, $and: [{categoryId: categoryId}]}).select('-subject.instructions').exec();
    const subject = test.subject;
    let testQuestions = ""
    for(const sub of subject) {
        if(sub.testId === req.params.testId) {
            testQuestions = JSON.parse(sub.testQuestions)
            break;
        }
    }

    res.render('tests/testQuestions', {  data:testQuestions.data.data , saved: true });
    // res.json(test);
})


export default router;