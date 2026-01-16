import 'dotenv/config.js';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import {generateResult} from './services/ai.service.js';

const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin: "*",
    }
});

io.use(async(socket,next)=>{
    try{
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error("Invalid projectId"));
        }

        socket.project = await projectModel.findById(projectId);

        if(!token){
            return next(new Error("Authentication error"));
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if(!decoded){
            return next(new Error("Authentication error"));
        }
        socket.user = decoded;
        next();
    }
    catch(error){
        console.log(error);
        return next(new Error("Authentication error"));
    }
})

io.on('connection', socket => {

    socket.roomId = socket.project._id.toString()

    console.log('New client connected');
    socket.join(socket.roomId);

    socket.on('project-message',async data =>{
        const message = data.message;
        const aiIsPresentInMessage = message.includes('@ai')|| message.includes('@aI') || message.includes('@AI')|| message.includes('@Ai');
        if(aiIsPresentInMessage){
            const prompt = message.replace('@ai', '').trim()|| message.replace('@aI', '').trim()|| message.replace('@AI', '').trim()|| message.replace('@Ai', '').trim();
            const result = await generateResult(prompt);
            socket.broadcast.to(socket.roomId).emit('project-message',data)
            io.to(socket.roomId).emit('project-message', {
                message: result,
                sender: 'AI',
            });
            return;
        }

        socket.broadcast.to(socket.roomId).emit('project-message',data)
    })

    socket.on('event', data => { /* … */ });
    socket.on('disconnect', () => {
        console.log('Client disconnected');
        socket.leave(socket.roomId);
     });
});

server.listen(process.env.PORT || 3000, () => {
    console.log(`Server on port ${process.env.PORT || 3000}`);
});