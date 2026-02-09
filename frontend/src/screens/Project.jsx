import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Markdown from 'markdown-to-jsx';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import axios from '../config/axios.js';
import { UserContext } from '../context/user-context';
import {
  disconnectSocket,
  initializeSocket,
  receiveMessage,
  sendMessage,
} from '../config/socket.js';

const safeParseJsonFromMessage = (rawMessage) => {
  if (typeof rawMessage !== 'string') return null;

  const match = rawMessage.match(/{[\s\S]*}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
};

const Project = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user } = useContext(UserContext);

  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [fileTree, setFileTree] = useState({});
  const [openFiles, setOpenFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
  const [isPeoplePanelOpen, setIsPeoplePanelOpen] = useState(false);
  const [isAddingCollaborators, setIsAddingCollaborators] = useState(false);
  const [error, setError] = useState('');

  const messageBoxRef = useRef(null);

  const availableUsers = useMemo(() => {
    const existingIds = new Set((project?.users || []).map((member) => String(member._id)));
    return users.filter((person) => !existingIds.has(String(person._id)));
  }, [users, project]);

  useEffect(() => {
    if (!projectId) {
      navigate('/', { replace: true });
      return;
    }

    const fetchProjectData = async () => {
      try {
        setIsLoadingProject(true);
        setError('');
        const [projectRes, usersRes] = await Promise.all([
          axios.get(`/projects/get-project/${projectId}`),
          axios.get('/users/all'),
        ]);
        setProject(projectRes.data.project);
        setUsers(usersRes.data.users || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load project.');
      } finally {
        setIsLoadingProject(false);
      }
    };

    fetchProjectData();
  }, [projectId, navigate]);

  useEffect(() => {
    if (!project?._id) return;

    initializeSocket(project._id);

    const onProjectMessage = (data) => {
      setMessages((prev) => [...prev, { ...data, type: 'incoming' }]);

      const parsed = safeParseJsonFromMessage(data?.message);
      if (parsed?.fileTree) {
        setFileTree(parsed.fileTree);
      }
    };

    receiveMessage('project-message', onProjectMessage);

    return () => {
      disconnectSocket();
    };
  }, [project?._id]);

  useEffect(() => {
    if (!messageBoxRef.current) return;
    messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!currentFile || !fileTree[currentFile]) return;
    const codeBlock = document.getElementById('code-block');
    if (!codeBlock) return;
    delete codeBlock.dataset.highlighted;
    hljs.highlightElement(codeBlock);
  }, [currentFile, fileTree]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || !user?.email) return;

    const newMessage = {
      message: trimmed,
      sender: user.email,
    };

    sendMessage('project-message', newMessage);
    setMessages((prev) => [...prev, { ...newMessage, type: 'outgoing' }]);
    setMessage('');
  };

  const renderAIMessage = (rawMessage) => {
    const parsed = safeParseJsonFromMessage(rawMessage);
    const text = parsed?.text || rawMessage;
    return (
      <div className="max-w-full overflow-x-auto">
        <Markdown>{text}</Markdown>
      </div>
    );
  };

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAddCollaborators = async () => {
    if (!selectedUserIds.length) return;
    try {
      setIsAddingCollaborators(true);
      await axios.put('/projects/add-user', {
        projectId,
        users: selectedUserIds,
      });
      const projectRes = await axios.get(`/projects/get-project/${projectId}`);
      setProject(projectRes.data.project);
      setSelectedUserIds([]);
      setIsCollaboratorModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add collaborators.');
    } finally {
      setIsAddingCollaborators(false);
    }
  };

  if (isLoadingProject) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto grid min-h-screen max-w-5xl place-items-center px-4">
          <p className="text-sm tracking-wide text-slate-300">Loading project...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(251,146,60,0.15),transparent_28%),radial-gradient(circle_at_85%_85%,rgba(110,231,183,0.12),transparent_30%)]" />

      <section className="relative mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[1fr_360px]">
        <div className="flex min-h-[85vh] flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Workspace</p>
              <h1 className="text-lg font-semibold text-white sm:text-xl">{project?.name || 'Project'}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10"
              >
                Back
              </button>
              <button
                onClick={() => setIsCollaboratorModalOpen(true)}
                className="rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Add Collaborator
              </button>
              <button
                onClick={() => setIsPeoplePanelOpen((prev) => !prev)}
                className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10"
              >
                Team
              </button>
            </div>
          </header>

          {error && (
            <div className="mx-4 mt-4 rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 sm:mx-6">
              {error}
            </div>
          )}

          <div className="grid min-h-0 flex-1 grid-cols-1 border-t border-white/5 lg:grid-cols-[260px_1fr]">
            <aside className="border-b border-white/10 bg-slate-900/50 p-3 lg:border-b-0 lg:border-r">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-300">Files</p>
              <div className="max-h-48 space-y-1 overflow-auto lg:max-h-[calc(100vh-280px)]">
                {Object.keys(fileTree).length === 0 ? (
                  <p className="text-sm text-slate-400">No generated files yet.</p>
                ) : (
                  Object.keys(fileTree).map((fileName) => (
                    <button
                      key={fileName}
                      onClick={() => {
                        setCurrentFile(fileName);
                        setOpenFiles((prev) => [...new Set([...prev, fileName])]);
                      }}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                        currentFile === fileName
                          ? 'bg-cyan-400/20 text-cyan-100'
                          : 'text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      {fileName}
                    </button>
                  ))
                )}
              </div>
            </aside>

            <section className="grid min-h-0 grid-rows-[1fr_auto]">
              <div ref={messageBoxRef} className="min-h-0 space-y-3 overflow-auto p-4 sm:p-6">
                {messages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-slate-300">
                    Start the conversation. Mention <span className="font-semibold text-cyan-200">@ai</span> to request generated code.
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={`${msg.sender}-${idx}`}
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        msg.type === 'outgoing'
                          ? 'ml-auto bg-cyan-400 text-slate-950'
                          : 'bg-slate-800 text-slate-100'
                      }`}
                    >
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] opacity-80">
                        {msg.sender}
                      </p>
                      {msg.sender === 'AI' ? renderAIMessage(msg.message) : msg.message}
                    </div>
                  ))
                )}
              </div>

              {currentFile && fileTree[currentFile] && (
                <div className="border-t border-white/10 bg-slate-900/70">
                  <div className="flex flex-wrap gap-2 border-b border-white/10 px-3 py-2">
                    {openFiles.map((fileName) => (
                      <button
                        key={fileName}
                        onClick={() => setCurrentFile(fileName)}
                        className={`rounded-md px-3 py-1 text-xs ${
                          currentFile === fileName
                            ? 'bg-cyan-400/25 text-cyan-100'
                            : 'bg-white/5 text-slate-200 hover:bg-white/10'
                        }`}
                      >
                        {fileName}
                      </button>
                    ))}
                  </div>
                  <pre className="max-h-64 overflow-auto p-4 text-xs">
                    <code id="code-block" className="language-javascript whitespace-pre-wrap break-words">
                      {fileTree[currentFile].content}
                    </code>
                  </pre>
                </div>
              )}

              <div className="border-t border-white/10 p-3 sm:p-4">
                <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-slate-900/80 p-2">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    type="text"
                    placeholder="Type a message..."
                    className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-400"
                  />
                  <button
                    onClick={handleSend}
                    className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                  >
                    Send
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        <aside
          className={`rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition ${
            isPeoplePanelOpen ? 'opacity-100' : 'opacity-75'
          }`}
        >
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200/80">Collaborators</h2>
          <div className="mt-4 space-y-2">
            {(project?.users || []).map((member) => (
              <div
                key={member._id}
                className="rounded-xl border border-white/10 bg-slate-900/55 px-3 py-2 text-sm"
              >
                <p className="font-medium text-white">{member.email}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {isCollaboratorModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/95 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Add Collaborators</h3>
              <button
                onClick={() => setIsCollaboratorModalOpen(false)}
                className="rounded-md border border-white/20 px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="mt-4 max-h-72 space-y-2 overflow-auto">
              {availableUsers.length === 0 ? (
                <p className="text-sm text-slate-400">No additional users available.</p>
              ) : (
                availableUsers.map((person) => (
                  <button
                    key={person._id}
                    onClick={() => toggleUserSelection(String(person._id))}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                      selectedUserIds.includes(String(person._id))
                        ? 'border-emerald-300/60 bg-emerald-400/10 text-emerald-100'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span>{person.email}</span>
                    {selectedUserIds.includes(String(person._id)) && <span>Selected</span>}
                  </button>
                ))
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setIsCollaboratorModalOpen(false)}
                className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCollaborators}
                disabled={!selectedUserIds.length || isAddingCollaborators}
                className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
              >
                {isAddingCollaborators ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Project;
