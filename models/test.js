import mongoose from "mongoose";

const {Schema} = mongoose;

const subjectSchema = new Schema({
    testId: String,
    name: String,
    totalQuestions: String,
    startTime: String,
    maxDuration: String,
    testStudentMappingId: String,
    instruction: String,
    testQuestions: String,
});

const testSchema = new Schema({
    name: String,
    categoryId: String,
    categoryModeId: String,
    previewImage: String,
    price: String,
    token: String,
    subject:[subjectSchema]
});

const Test = mongoose.model('Test', testSchema);

export {Test};