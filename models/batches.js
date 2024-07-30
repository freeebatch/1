import mongoose from "mongoose";
const { Schema } = mongoose;

const tokenSchema = new Schema({
    access_token: String,
    refresh_token: String
});

// Define subdocument schemas
const videoSchema = new Schema({
    topic: String,
    date: String,
    videoDetails: {
        name: String,
        image: String,
        videoUrl: String,
        duration: String,
        key: {
            kid: String,
            k: String
        }
    }
});

const dppVideoSchema = new Schema({
    topic: String,
    date: String,
    videoDetails: {
        name: String,
        image: String,
        videoUrl: String,
        duration: String,
        key: {
            kid: String,
            k: String
        }
    }
});

const noteSchema = new Schema({
    topic: String,
    note: String,
    pdfName: String,
    pdfUrl: String
});

const dppSchema = new Schema({
    topic: String,
    note: String,
    pdfName: String,
    pdfUrl: String
});

const chapterSchema = new Schema({
    name: String,
    type: String,
    typeId: String,
    displayOrder: String,
    notes: String,
    exercises: String,
    videos: String,
    slug: String,
    videosSch: [videoSchema], // Assuming each chapter can have multiple videos
    notesSch: [noteSchema], // Assuming each chapter can have multiple notes
    dppVideosSch: [dppVideoSchema], // Assuming each chapter can have multiple videos
    dppSch: [dppSchema] // Assuming each chapter can have multiple notes
});

const subjectSchema = new Schema({
    subject: String,
    imageId: String,
    slug: String,
    tagCount: String,
    chapters: [chapterSchema]
});

const batchSchema = new Schema({
    name: String,
    byName: String,
    language: String,
    previewImage: String,
    slug: String,
    token: String,
    subjects: [subjectSchema]
});

// Define models
const Batch = mongoose.model('Batch', batchSchema);
const Subject = mongoose.model('Subject', subjectSchema);
const Chapter = mongoose.model('Chapter', chapterSchema);
const Video = mongoose.model('Video', videoSchema);
const Note = mongoose.model('Note', noteSchema);
const DppVideo = mongoose.model('DppVideo', dppVideoSchema);
const Dpp = mongoose.model('Dpp', dppSchema);
const Token = mongoose.model('Token', tokenSchema);

export { Batch, Subject, Chapter, Video, Note, DppVideo, Dpp, Token };