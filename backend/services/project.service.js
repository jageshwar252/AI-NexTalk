import Project from "../models/project.model.js";
import mongoose from "mongoose";

export const createProject = async ({name,userId}) => {
    if (!name) {
        throw new Error("Project name is required");
    }
    if (!userId) {
        throw new Error("User ID is required");
    }
    let project;
    try{
        project = await Project.create({ name, users: [userId] });
    }
    catch(error){
        if (error.code === 11000) {
            throw new Error("Project name already exists");
        }
        throw error;
    }

    return project
}

export const getAllProjectByUserId = async ({userId}) => {
    if (!userId) {
        throw new Error("User ID is required");
    }
    const allUserProjects = await Project.find({ users: userId });
    return allUserProjects;
}

export const addUsersToProject = async ({projectId,users,userId}) => {
    if (!projectId) {
        throw new Error("Project ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid Project ID");
    }

    if (!Array.isArray(users) || !users.some(userId => mongoose.Types.ObjectId.isValid(userId))) {
        throw new Error("Invalid User IDs in the array");
    }
    if (!users || users.length === 0) {
        throw new Error("Users are required");
    }
    if(!userId){
        throw new Error("User ID is required");
    }
    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new Error("Invalid User ID");
    }
    const project = await Project.findOne({
        _id:projectId,
        users:userId,
    });
    if (!project) {
        throw new Error("Project not found");
    }
    const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { $addToSet: { users: { $each: users } } },
        { new: true }
    );
    return updatedProject;
}

export const getProjectById = async ({projectId}) => {
    if (!projectId) {
        throw new Error("Project ID is required");
    }
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid Project ID");
    }
    const project = await Project.findOne({
        _id: projectId,
    }).populate('users');
    if (!project) {
        throw new Error("Project not found");
    }
    return project;
}