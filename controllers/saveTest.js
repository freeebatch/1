import {Test} from '../models/test.js'
import {paidTest,paidTestAll,testInstructions,testQuestions} from './test.js'

export async function saveTestToMongoDB (token, testModeId, categoryId) {
    const test = await Test.findOne({testModeId: testModeId});
    if (test) {
        console.log("Test Already Exits", test)
        return null;
    }

    const testsData = await paidTest(token);

    testsData.data.forEach(async (test) => {
        if (test.categoryModeId === testModeId && test.categoryId === categoryId) {
            await saveTestData(test, token)
        }
    });

     // Fetch and save subject data for each batch
    console.log('Saving Test :- ', testModeId);
    await saveTestSubjectData(token, testModeId, categoryId);
    console.log('Test Saved :- ', testModeId);
    
};

async function saveTestData(test, token) {
    try{
        const saveTest = new Test({
            name: test.name,
            categoryId: test.categoryId,
            categoryModeId: test.categoryModeId,
            previewImage: test.previewImage,
            price: test.price,
            token: token
        });
        await saveTest.save();
    }
    catch(error){
        console.log(error)
    }
}  

async function saveTestSubjectData(token, testModeId, categoryId){
    try{
        const subjects = await paidTestAll(token, testModeId, categoryId);

        const test = await Test.findOne({categoryModeId: testModeId, $and: [{categoryId: categoryId}]});
        if(!test){
            console.log("Test Not Found")
            return null;
        }

        for(const subject of subjects.data){
            const testInstructionsData = await testInstructions(token, subject.testId);
            const testQuestionsData = await testQuestions(token, subject.testId, test.categoryModeId, "Finished", subject.testStudentMappingId);
            const newSubject = {
                testId: subject.testId,
                name: subject.name,
                totalQuestions: subject.totalQuestions,
                startTime: subject.startTime,
                maxDuration: subject.maxDuration,
                testActivityStatus: subject.testActivityStatus,
                testStudentMappingId: subject.testStudentMappingId,
                instruction: JSON.stringify(testInstructionsData),
                testQuestions: JSON.stringify(testQuestionsData),
            }

            test.subject.push(newSubject);
            console.log('Subject Saved :- ', subject.name);
        }

        await test.save();

    }
    catch(error){
        console.error(error)
    }
}