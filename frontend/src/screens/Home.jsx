import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/user-context';
import axios from '../config/axios.js';

const Home = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const sortedProjects = useMemo(() => {
    return [...projects].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [projects]);

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      setError('');
      const res = await axios.get('/projects/all');
      setProjects(res.data.projects || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not fetch projects.');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchProjects();
  }, [user]);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      setIsLoggingOut(true);
      setError('');
      await axios.post('/users/logout');
      localStorage.removeItem('token');
      setUser(null);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Logout failed.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      setIsCreatingProject(true);
      setError('');
      const res = await axios.post('/projects/create', { name: projectName.trim() });
      const createdProject = res.data?.project;
      if (createdProject) {
        setProjects((prev) => [createdProject, ...prev]);
      }
      setProjectName('');
      setIsModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create project.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(34,197,94,0.16),transparent_26%),radial-gradient(circle_at_80%_80%,rgba(244,114,182,0.14),transparent_26%)]" />

      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8">
        <header className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">AI NexTalk</p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                Welcome, {user?.email}
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                Create or open a workspace to collaborate with your team and AI.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                New Project
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10 disabled:opacity-60"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white sm:text-xl">Your Projects</h2>
            <button
              onClick={fetchProjects}
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          {isLoadingProjects ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, idx) => (
                <div
                  key={idx}
                  className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                />
              ))}
            </div>
          ) : sortedProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center text-slate-300">
              No projects yet. Create your first project to get started.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {sortedProjects.map((project) => (
                <button
                  key={project._id}
                  onClick={() =>
                    navigate(`/project/${project._id}`, {
                      state: {
                        projectId: project._id,
                        projectName: project.name,
                        createdAt: project.createdAt,
                      },
                    })
                  }
                  className="group rounded-2xl border border-white/10 bg-white/5 p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-1 text-lg font-semibold text-white">{project.name}</h3>
                    <span className="rounded-md bg-cyan-400/20 px-2 py-1 text-[11px] font-medium text-cyan-200">
                      Open
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">
                    Created on {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">Create Project</h2>
            <p className="mt-2 text-sm text-slate-300">Give your workspace a clear, memorable name.</p>

            <form onSubmit={handleCreateProject} className="mt-5 space-y-4">
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                type="text"
                placeholder="e.g. Agentic Task Board"
                className="w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-400/20"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProject}
                  className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                >
                  {isCreatingProject ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;
