const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
        index: true
    },
    parentTaskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        default: null,
        index: true
    },
    assigneeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: "",
        trim: true
    },
    status: {
        type: String,
        enum: ["todo", "in_progress", "done", "cancelled"],
        default: "todo",
        index: true
    },
    estimatedHours: {
        type: Number,
        min: 0,
        default: 0
    },
    actualHours: {
        type: Number,
        min: 0,
        default: 0
    },
    startedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

taskSchema.index({ projectId: 1, status: 1 });

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;
