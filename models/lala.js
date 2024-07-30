import mongoose from "mongoose";
const { Schema } = mongoose;

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
    videos: [{ type: Schema.Types.ObjectId, ref: 'Videos' }], // Reference to Video documents
    dppVideos: [{ type: Schema.Types.ObjectId, ref: 'DppVideos' }], // Reference to DppVideo documents
    notes: [{ type: Schema.Types.ObjectId, ref: 'Notes' }], // Reference to Note documents
    dpps: [{ type: Schema.Types.ObjectId, ref: 'Dpps' }] // Reference to Dpp documents
});

const subjectSchema = new Schema({
    subject: String,
    imageId: String,
    slug: String,
    chapters: [{ type: Schema.Types.ObjectId, ref: 'Chapters' }] // Reference to Chapter documents
});

const batchSchema = new Schema({
    name: String,
    byName: String,
    language: String,
    previewImage: String,
    slug: String,
    subjects: [{ type: Schema.Types.ObjectId, ref: 'Subjects' }] // Reference to Subject documents
});

const Batch = mongoose.model('Batchs', batchSchema);
const Subject = mongoose.model('Subjects', subjectSchema);
const Chapter = mongoose.model('Chapters', chapterSchema);
const Video = mongoose.model('Videos', videoSchema);
const Note = mongoose.model('Notes', noteSchema);
const DppVideo = mongoose.model('DppVideos', dppVideoSchema);
const Dpp = mongoose.model('Dpps', dppSchema);

export { Batch, Subject, Chapter, Video, Note, DppVideo, Dpp };
