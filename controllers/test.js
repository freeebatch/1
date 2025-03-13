import fetch from 'node-fetch';

// enum testActivityStatus {
//     "NotStarted"= "Start",
//     "Started"= "Resume",
//     "Finished"= "Reattempt"
// }

export async function paidTest(token) {
    const url = 'https://api.penpencil.co/v3/test-service/test-categories/my-test-categories?cohortId=635140fa481fd3001120c9ba';
    const headers = {
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const extractedData = data.data.map(item => ({
            name: item.name,
            categoryId: item.categoryId,
            categoryModeId: item.categoryModeId,
            previewImage: `${item.imageId ? item.imageId.baseUrl + item.imageId.key : ''}`,
            price: item.price
        }));
        const extractedJson = { data: extractedData };
        return extractedJson;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

export async function paidTestAll(token, testModeId, categoryId) {
    const url = `https://api.penpencil.co/v3/test-service/tests?testModeId=${testModeId}&testType=All&testStatus=All&attemptStatus=All&isSubjective=false&categoryId=${categoryId}&categorySectionId=Other_Tests&isPurchased=true`;
    const headers = {
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const extractedData = data.data.map(item => ({
            testId: item._id,
            name: item.name,
            totalQuestions: item.totalQuestions,
            totalMarks: item.totalMarks,
            startTime: item.startTime,
            maxDuration: item.maxDuration,
            testActivityStatus: item.testActivityStatus,
            testStudentMappingId: item?.testStudentMappingId || "",
        }));
        const extractedJson = { data: extractedData };
        return extractedJson;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


export async function testInstructions(token, testId) {
    const url = `https://api.penpencil.co/v3/test-service/tests/${testId}/instructions`;
    const headers = {
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();
        data = data.data;
        const extractedData = {
            name: data.name,
            totalQuestions: data.totalQuestions,
            totalMarks: data.totalMarks,
            maxDuration: data.maxDuration,
            multiGeneralInstructions: data.multiGeneralInstructions?.en,
            multiTestInstructions: data.multiTestInstructions?.en,
            syllabus: data.syllabus?.en,
        };
        const extractedJson = { data: extractedData };
        return extractedJson;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

export async function testQuestions(token, testId, categoryModeId, testActivityStatus, testStudentMapping) {
    const headers = {
        'Authorization': `Bearer ${token}`
    };

    try {
        if (testActivityStatus !== "Finished") {
            const mode = testActivityStatus === "NotStarted" ? "Start" : "Resume";
            testStudentMapping = await getTestStudentMapping(token, testId, categoryModeId, mode);
            if (!testStudentMapping) {
                return { success: false };
            }
            const isTestFinished = await finishTest(token, testStudentMapping);
            if (!isTestFinished) {
                return { success: false };
            }
        }

        const url = `https://api.penpencil.co/v3/test-service/tests/mapping/${testStudentMapping}/preview-test`
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.text}`);
        }
        const data = await response.json();

        const extractedJson = { data: data };
        return extractedJson;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function getTestStudentMapping(token, testId, categoryModeId, mode = "Start") {
    const url = `https://api.penpencil.co/v3/test-service/tests/${testId}/start-test?testSource=TEST_SERIES&type=${mode}&testModeId=${categoryModeId}`;
    const headers = {
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const testStudentMapping = data.data.testStudentMapping._id;
        console.log("testStudentMapping ✅", testStudentMapping)
        return testStudentMapping;

    } catch (error) {
        console.error('Error getTestStudentMapping data:', error);
        return false;
    }

}

async function finishTest(token, testStudentMapping) {
    const url = `https://api.penpencil.co/v3/test-service/tests/mapping/${testStudentMapping}/submit-test?cohortId=635140fa481fd3001120c9ba`;
    const headers = {
        "Authorization": `Bearer ${token}`,
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.6",
        "client-id": "5eb393ee95fab7468a79d189",
        "client-type": "WEB",
        "client-version": "300",
        "content-type": "application/json",
    };

    const body = {
        "isSubjective": false,
        "lastVisitedQuestionId": "667fc3f00d6b5f284df0d6db",
        "questionsResponses": [
            {
                "questionId": "667fc3f00d6b5f284df0d6db",
                "timeTaken": 39,
                "status": "UnAttempted"
            }
        ],
        "submittedBy": "user",
        "type": "Sync",
        "selectedOptionalSections": [],
        "language": "English"
    };

    // console.log("Submitting test to URL:", url);
    try {


        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();


        if (data?.success) {
            console.log('✅ Test submitted successfully');
            return true;
        } else {
            console.log('❌ Test submission failed');
            return false;
        }


    } catch (error) {
        console.error('Error finishTest data:', error);
        return false;
    }

}