import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../config/axios.js';
import { initializeSocket, receiveMessage, sendMessage } from '../config/socket.js';
import { UserContext } from '../context/user.context.jsx';
import Markdown from 'markdown-to-jsx';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';


const Project = ({ navigate }) => {
    const location = useLocation();
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState([]);
    const [project, setProject] = useState(location.state.project);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]); // State to store messages
    const { user } = useContext(UserContext);

    const [users, setUsers] = useState([]);
    const [fileTree, setFileTree] = useState({});

    const [currentFile, setCurrentFile] = useState(null);
    const [openFiles, setOpenFiles] = useState([]);

    const handleUserSelect = (id) => {
        setSelectedUserId((prevSelectedUserId) => {
            const updatedSet = new Set(prevSelectedUserId);
            if (updatedSet.has(id)) {
                updatedSet.delete(id);
            } else {
                updatedSet.add(id);
            }
            return updatedSet;
        });
    };

    function addCollaborators() {
        axios.put('/projects/add-user', {
            projectId: location.state.projectId,
            users: Array.from(selectedUserId)
        }).then((response) => {
            console.log('Collaborators added successfully:', response.data);
            setIsModalOpen(false);
            setSelectedUserId([]);
        })
            .catch((error) => {
                console.error('Error adding collaborators:', error);
            });
    }

    function scrollToBottom() {
        const messageBox = document.querySelector('.message-box');
        if (messageBox) {
            messageBox.scrollTop = messageBox.scrollHeight;
        }
    }

    function send() {
        const newMessage = {
            message: message,
            sender: user.email,
        };
        sendMessage('project-message', newMessage);
        appendOutgoingMessage(newMessage);
        setTimeout(() => {
            scrollToBottom();
        }, 0);
        setMessage('');
    }

    function WriteAIMessage(message) {
        let cleanMessage = message;

        // Extract only the JSON part inside { }
        const match = message.match(/{[\s\S]*}/);
        if (match) {
            cleanMessage = match[0];
        }
        const messageObject = JSON.parse(cleanMessage);
        return (

            <div className='overflow-auto max-w-96'>
                <Markdown>{messageObject.text}</Markdown>
            </div>
        )
    }

    function appendOutgoingMessage(messageObject) {
        setMessages((prevMessages) => [...prevMessages, { ...messageObject, type: 'outgoing' }]);
    }

    function appendIncomingMessage(messageObject) {
        setMessages((prevMessages) => [...prevMessages, { ...messageObject, type: 'incoming' }]);
    }

    useEffect(() => {
        axios.get(`projects/get-project/${location.state.projectId}`)
            .then((response) => {
                setProject(response.data.project);
            })
            .catch((error) => {
                console.error('Error fetching project:', error);
            });

        axios.get('/users/all')
            .then((response) => {
                setUsers(response.data.users);
            })
            .catch((error) => {
                console.error('Error fetching users:', error);
            });
    }, []);

    useEffect(() => {
        if (!project?._id) return;
        initializeSocket(project._id);

        receiveMessage('project-message', async (data) => {
            appendIncomingMessage(data);
            let cleanMessage = data.message;
            const match = data.message.match(/{[\s\S]*}/);
            if (match) {
                cleanMessage = match[0];
            }
            const newMessage = await JSON.parse(cleanMessage);
            if (newMessage.fileTree) {
                setFileTree(newMessage.fileTree);
            }
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        });
    }, [project]);

    useEffect(() => {
        if (currentFile && fileTree[currentFile]) {
            const codeBlock = document.getElementById('code-block');
            if (codeBlock) {
                delete codeBlock.dataset.highlighted; // 🛠 Unset the previous highlighting
                hljs.highlightElement(codeBlock);      // 🎯 Highlight again
            }
        }
    }, [currentFile, fileTree]);


    return (
        <main className="h-screen w-screen flex">
            <section className="left relative flex flex-col h-full min-w-96 bg-gray-900 text-white">
                <header className="flex justify-between items-center p-2 px-4 w-full bg-gray-800 absolute top-0">
                    <button
                        className="cursor-pointer flex gap-2 items-center z-10 text-white"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <i className="ri-add-line"></i>
                        <p>Add Collaborator</p>
                    </button>
                    <button
                        onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                        className="p-2 cursor-pointer z-10 text-white"
                    >
                        <i className="ri-group-fill"></i>
                    </button>
                </header>

                <div className="conversation-area flex flex-col flex-grow relative pt-14 pb-12 overflow-auto scrollbar-hide">
                    <div className="message-box p-2 flex flex-grow flex-col gap-2 overflow-auto scrollbar-hide">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message p-2 max-w-56 w-fit rounded-md flex flex-col ${msg.type === 'outgoing'
                                        ? 'ml-auto bg-green-700 text-white'
                                        : 'bg-gray-800 text-white'
                                    }`}
                            >
                                <small className="opacity-65 text-xs">{msg.sender}</small>
                                <p className="text-sm">
                                    {msg.type === 'incoming' && msg.sender === 'AI'
                                        ? WriteAIMessage(msg.message)
                                        : msg.message}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="input-field w-full flex p-1 absolute bottom-0 left-0 bg-gray-800">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    send();
                                }
                            }}
                            className="p-2 px-2 mr-1 border-none outline-none bg-gray-700 text-white flex-grow"
                            type="text"
                            placeholder="Enter your message"
                        />
                        <button onClick={send} className="px-5 bg-green-600 text-white">
                            <i className="ri-send-plane-2-fill"></i>
                        </button>
                    </div>
                </div>

                <div
                    className={`sidepanel z-50 flex flex-col gap-2 w-full h-full bg-gray-800 absolute transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'
                        } top-0`}
                >
                    <header className="flex justify-between items-center p-2 px-3 bg-gray-700">
                        <h1 className="font-semibold text-lg text-white">Collaborators</h1>
                        <button
                            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
                            className="p-2 cursor-pointer text-white"
                        >
                            <i className="ri-close-fill"></i>
                        </button>
                    </header>

                    <div className="users flex flex-col gap-2">
                        {!project ? (
                            <div className="text-white">Loading project...</div>
                        ) : (
                            <div className="users flex flex-col gap-2">
                                {project.users?.map((user) => (
                                    <div
                                        key={user._id}
                                        className="p-1 user cursor-pointer hover:bg-gray-700 flex gap-2 items-center"
                                    >
                                        <div className="aspect-square w-10 h-10 rounded-full bg-gray-600 p-2 flex justify-center items-center text-white">
                                            <i className="ri-user-line"></i>
                                        </div>
                                        <h1 className="font-semibold text-lg text-white">{user.email}</h1>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>


            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
                    <div className="bg-white opacity-100 max-h-96 overflow-auto rounded-lg shadow-lg w-11/12 max-w-md p-4">
                        <header className="flex justify-between items-center border-b pb-2">
                            <h2 className="text-lg font-semibold">Select a User</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <i className="ri-close-fill text-xl"></i>
                            </button>
                        </header>
                        <div className="mt-4">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className={`flex items-center gap-4 p-2 hover:bg-gray-400 ${Array.from(selectedUserId).indexOf(user._id) != -1 ? 'bg-gray-400' : ""} cursor-pointer`}
                                    onClick={() => handleUserSelect(user._id)}
                                >
                                    <div className="aspect-square w-10 h-10 rounded-full bg-slate-400 flex justify-center items-center">
                                        <i className="ri-user-line"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{user.name}</h3>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={addCollaborators}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Add Collaborators
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <section className='right bg-gray-900 flex flex-grow h-full'>
                <div className="explorer h-full max-w-64 min-w-52 bg-gray-600">
                    <div className="file-tree bg-gray-600 text-white">
                        {Object.keys(fileTree).map((fileName) => (
                            <button onClick={() => {
                                setCurrentFile(fileName)
                                setOpenFiles([...new Set([...openFiles, fileName])])
                            }
                            } key={fileName} className="flex file-item p-2 w-full cursor-pointer hover:bg-gray-500 transition-all">
                                <span className="ml-2">{fileName}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {currentFile && (
                    <div className="code-editor flex flex-grow flex-col h-full min-w-0">
                        {/* Top Tabs */}
                        <div className="top h-12 flex flex-wrap overflow-x-auto shrink-0 bg-gray-500">
                            {openFiles.map((fileName) => (
                                <div key={fileName} className="flex items-center gap-2 file-item p-2 cursor-pointer hover:bg-gray-400">
                                    <span className="ml-2">{fileName}</span>
                                    <button
                                        onClick={() => {
                                            const updated = openFiles.filter((file) => file !== fileName);
                                            setOpenFiles(updated);
                                            if (currentFile === fileName) {
                                                setCurrentFile(updated[0] || null);
                                            }
                                        }}
                                        className="ml-auto rounded-md hover:bg-white transition-all"
                                    >
                                        <i className="ri-close-fill"></i>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Code Viewer */}
                        <div className="h-full w-full overflow-auto p-4 bg-gray-900 text-white">
                            {fileTree[currentFile] && (
                                <pre className="h-full w-full overflow-auto p-4">
                                    <code
                                        id="code-block"
                                        className="language-javascript whitespace-pre-wrap break-words"
                                    >
                                        {fileTree[currentFile].content}
                                    </code>
                                </pre>
                            )}
                        </div>
                    </div>
                )}

            </section>

        </main>
    );
};

export default Project;