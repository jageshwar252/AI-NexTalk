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
  isRealtimeEnabled,
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
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

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
    if (!isRealtimeEnabled()) return;
    if (!project?._id) return;

    initializeSocket(project._id);

    const onProjectMessage = (data) => {
      const shouldStickToBottom = (() => {
        const box = messageBoxRef.current;
        if (!box) return true;
        return box.scrollHeight - box.scrollTop - box.clientHeight < 120;
      })();

      setMessages((prev) => [...prev, { ...data, type: 'incoming' }]);
      if (data?.sender === 'AI') {
        setIsAiThinking(false);
      }

      const parsed = safeParseJsonFromMessage(data?.message);
      if (parsed?.fileTree) {
        setFileTree(parsed.fileTree);
      }

      setTimeout(() => {
        const box = messageBoxRef.current;
        if (!box) return;
        if (shouldStickToBottom) {
          box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
          setShowScrollDown(false);
        } else {
          setShowScrollDown(true);
        }
      }, 0);
    };

    receiveMessage('project-message', onProjectMessage);

    return () => {
      disconnectSocket();
    };
  }, [project?._id]);

  useEffect(() => {
    const box = messageBoxRef.current;
    if (!box) return;

    const onScroll = () => {
      const distance = box.scrollHeight - box.scrollTop - box.clientHeight;
      setShowScrollDown(distance > 120);
    };

    box.addEventListener('scroll', onScroll);
    onScroll();
    return () => {
      box.removeEventListener('scroll', onScroll);
    };
  }, []);

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

    const isAiMessage = /@ai/i.test(trimmed);
    const realtimeEnabled = isRealtimeEnabled();

    if (realtimeEnabled) {
      sendMessage('project-message', newMessage);
    }
    setMessages((prev) => [...prev, { ...newMessage, type: 'outgoing' }]);

    if (isAiMessage && !realtimeEnabled) {
      setIsAiThinking(true);
      axios
        .get('/ai/get-result', {
          params: { prompt: trimmed.replace(/@ai/i, '').trim() },
        })
        .then((res) => {
          const aiMessage = {
            sender: 'AI',
            message: res.data,
            type: 'incoming',
          };
          setMessages((prev) => [...prev, aiMessage]);

          const parsed = safeParseJsonFromMessage(res.data);
          if (parsed?.fileTree) {
            setFileTree(parsed.fileTree);
          }
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'AI request failed.');
        })
        .finally(() => {
          setIsAiThinking(false);
          setTimeout(() => {
            const box = messageBoxRef.current;
            if (!box) return;
            box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
            setShowScrollDown(false);
          }, 0);
        });
    } else if (isAiMessage) {
      setIsAiThinking(true);
    }

    setMessage('');

    setTimeout(() => {
      const box = messageBoxRef.current;
      if (!box) return;
      box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
      setShowScrollDown(false);
    }, 0);
  };

  const renderAIMessage = (rawMessage) => {
    const parsed = safeParseJsonFromMessage(rawMessage);
    const text = parsed?.text || rawMessage;
    return (
      <div className="chat-markdown max-h-64 max-w-full overflow-auto break-words">
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
      <main className="min-h-screen bg-[#06353b] text-[#ecf3f3]">
        <div className="mx-auto grid min-h-screen max-w-5xl place-items-center px-4">
          <p className="text-sm tracking-wide text-[#d7e5e6]">Loading project...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06353b] text-[#ecf3f3]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(250,92,92,0.28),transparent_30%),radial-gradient(circle_at_90%_10%,rgba(253,138,107,0.24),transparent_28%),radial-gradient(circle_at_85%_85%,rgba(254,194,136,0.2),transparent_30%)]" />

      <section className="relative mx-auto grid h-[calc(100vh-2rem)] max-w-[1400px] grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[1fr_360px]">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-[#d3d3d355] bg-[#0a4c54cc] backdrop-blur-xl">
          <header className="flex items-center justify-between border-b border-[#d3d3d344] px-4 py-4 sm:px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#d3d3d3]">Workspace</p>
              <h1 className="text-lg font-semibold text-[#fff7df] sm:text-xl">{project?.name || 'Project'}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="rounded-lg border border-[#d3d3d388] px-3 py-1.5 text-xs font-semibold transition hover:bg-[#d3d3d322]"
              >
                Back
              </button>
              <button
                onClick={() => setIsCollaboratorModalOpen(true)}
                className="rounded-lg bg-[#1ab3b5] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#22bfc3]"
              >
                Add Collaborator
              </button>
              <button
                onClick={() => setIsPeoplePanelOpen((prev) => !prev)}
                className="rounded-lg border border-[#d3d3d388] px-3 py-1.5 text-xs font-semibold transition hover:bg-[#d3d3d322]"
              >
                Team
              </button>
            </div>
          </header>

          {error && (
            <div className="mx-4 mt-4 rounded-xl border border-[#1ab3b580] bg-[#1ab3b51c] px-4 py-3 text-sm text-[#e3eded] sm:mx-6">
              {error}
            </div>
          )}

          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden border-t border-[#d3d3d333] lg:grid-cols-[260px_1fr]">
            <aside className="border-b border-[#d3d3d344] bg-[#083c43cc] p-3 lg:border-b-0 lg:border-r">
              <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[#d9e8e8]">Files</p>
              <div className="max-h-48 space-y-1 overflow-auto lg:max-h-[calc(100vh-280px)]">
                {Object.keys(fileTree).length === 0 ? (
                  <p className="text-sm text-[#f5cda9]">No generated files yet.</p>
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
                          ? 'bg-[#1ab3b533] text-[#f2f7f7]'
                          : 'text-[#deecec] hover:bg-[#d3d3d322]'
                      }`}
                    >
                      {fileName}
                    </button>
                  ))
                )}
              </div>
            </aside>

            <section className="relative grid min-h-0 overflow-hidden grid-rows-[1fr_auto]">
              <div ref={messageBoxRef} className="min-h-0 space-y-3 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
                {messages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#d3d3d377] bg-[#d3d3d31f] p-4 text-sm text-[#d6e6e7]">
                    Start the conversation. Mention <span className="font-semibold text-[#d3d3d3]">@ai</span> to request generated code.
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={`${msg.sender}-${idx}`}
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                        msg.type === 'outgoing'
                          ? 'ml-auto bg-[#1ab3b5] text-white'
                          : 'bg-[#402222] text-[#fff3df]'
                      }`}
                    >
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] opacity-80">
                        {msg.sender}
                      </p>
                      <div className="max-h-64 overflow-auto whitespace-pre-wrap break-words">
                        {msg.sender === 'AI' ? renderAIMessage(msg.message) : msg.message}
                      </div>
                    </div>
                  ))
                )}
                {isAiThinking && (
                  <div className="max-w-[70%] rounded-2xl bg-[#402222] px-4 py-3 text-sm text-[#fff3df]">
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] opacity-80">AI</p>
                    <div className="flex items-center gap-2">
                      <span>Thinking</span>
                      <span className="thinking-dots"><span></span><span></span><span></span></span>
                    </div>
                  </div>
                )}
              </div>
              {showScrollDown && (
                <button
                  onClick={() => {
                    const box = messageBoxRef.current;
                    if (!box) return;
                    box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
                    setShowScrollDown(false);
                  }}
                  className="absolute bottom-24 right-6 rounded-full bg-[#22bfc3] px-4 py-2 text-xs font-semibold text-white shadow-lg transition hover:bg-[#1ab3b5]"
                >
                  Scroll Down
                </button>
              )}

              {currentFile && fileTree[currentFile] && (
                <div className="border-t border-[#d3d3d344] bg-[#07373dd6]">
                  <div className="flex flex-wrap gap-2 border-b border-[#d3d3d344] px-3 py-2">
                    {openFiles.map((fileName) => (
                      <button
                        key={fileName}
                        onClick={() => setCurrentFile(fileName)}
                        className={`rounded-md px-3 py-1 text-xs ${
                          currentFile === fileName
                            ? 'bg-[#1ab3b555] text-[#f2f7f7]'
                            : 'bg-[#d3d3d322] text-[#deecec] hover:bg-[#d3d3d333]'
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

              <div className="border-t border-[#d3d3d344] p-3 sm:p-4">
                <div className="flex items-center gap-2 rounded-2xl border border-[#d3d3d355] bg-[#07373dde] p-2">
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
                    className="w-full bg-transparent px-3 py-2 text-sm text-[#ecf3f3] outline-none placeholder:text-[#f6c9a4]"
                  />
                  <button
                    onClick={handleSend}
                    className="rounded-xl bg-[#22bfc3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1ab3b5]"
                  >
                    Send
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        <aside
          className={`rounded-3xl border border-[#d3d3d355] bg-[#0a4c54cc] p-4 backdrop-blur-xl transition ${
            isPeoplePanelOpen ? 'opacity-100' : 'opacity-75'
          }`}
        >
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d3d3d3]">Collaborators</h2>
          <div className="mt-4 space-y-2">
            {(project?.users || []).map((member) => (
              <div
                key={member._id}
                className="rounded-xl border border-[#d3d3d344] bg-[#083f46ca] px-3 py-2 text-sm"
              >
                <p className="font-medium text-[#f2f7f7]">{member.email}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {isCollaboratorModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1d0f0fcc] p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[#d3d3d355] bg-[#0a4a52f2] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#f2f7f7]">Add Collaborators</h3>
              <button
                onClick={() => setIsCollaboratorModalOpen(false)}
                className="rounded-md border border-[#d3d3d355] px-2 py-1 text-xs text-[#deecec] hover:bg-[#d3d3d322]"
              >
                Close
              </button>
            </div>

            <div className="mt-4 max-h-72 space-y-2 overflow-auto">
              {availableUsers.length === 0 ? (
                <p className="text-sm text-[#f3caa6]">No additional users available.</p>
              ) : (
                availableUsers.map((person) => (
                  <button
                    key={person._id}
                    onClick={() => toggleUserSelection(String(person._id))}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                      selectedUserIds.includes(String(person._id))
                        ? 'border-[#d3d3d3] bg-[#d3d3d330] text-[#f3f6f6]'
                        : 'border-[#d3d3d344] bg-[#d3d3d322] text-[#deecec] hover:bg-[#d3d3d338]'
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
                className="rounded-lg border border-[#d3d3d355] px-4 py-2 text-sm text-[#deecec] hover:bg-[#d3d3d322]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCollaborators}
                disabled={!selectedUserIds.length || isAddingCollaborators}
                className="rounded-lg bg-[#1ab3b5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#22bfc3] disabled:opacity-60"
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
