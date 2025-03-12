import mongoose from "mongoose";
const { Schema } = mongoose;

const tokenSchema = new Schema({
    access_token: String,
    refresh_token: String
});


const videoSchema = new Schema({
    topic: String,
    date: String,
    videoDetails: {
        name: String,
        image: String,
        videoUrl: String,
        duration: String,
    }
});

const noteSchema = new Schema({
    topic: String,
    note: String,
    pdfName: String,
    pdfUrl: String
});


const topicSchema = new Schema({
    name: String,
    topicId: String,
    totalLectures: String,
    totalNotes: String,
    totalExercises: String,
    videosSch: [videoSchema], 
    notesSch: [noteSchema],
});

const chapterSchema = new Schema({
    name: { type: String, required: true },
    organizationId: { type: String, required: true },
    programId: { type: String, required: true },
    subjectId: { type: String, required: true },
    slug: { type: String, required: true },
    previewImage: { type: String },
    topicSchema: [topicSchema]
});

const subjectSchema = new Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    chapters: [chapterSchema]
});

const batchSchema = new Schema({
    name: String,
    byName: String,
    language: String,
    previewImage: String,
    khazanaProgramId: String,
    slug: String,
    token: String,
    subjects: [subjectSchema]
});

// Define models
const Batch = mongoose.model('KhazanaBatch', batchSchema);
// const Subject = mongoose.model('KhazanaSubject', subjectSchema);
// const Chapter = mongoose.model('KhazanaChapter', chapterSchema);
// const Video = mongoose.model('KhazanaVideo', videoSchema);
// const Note = mongoose.model('KhazanaNote', noteSchema);
// const Token = mongoose.model('KhazanaToken', tokenSchema);

export { Batch };
// export { Batch, Subject, Chapter, Video, Note, Token };