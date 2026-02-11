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

  const getProjectTime = (project) => {
    const createdAt = project?.createdAt ? new Date(project.createdAt) : null;
    if (createdAt && !Number.isNaN(createdAt.getTime())) {
      return createdAt.getTime();
    }

    if (typeof project?._id === 'string' && project._id.length >= 8) {
      const seconds = parseInt(project._id.substring(0, 8), 16);
      if (!Number.isNaN(seconds)) return seconds * 1000;
    }

    return 0;
  };

  const formatProjectDate = (project) => {
    const createdAt = project?.createdAt ? new Date(project.createdAt) : null;
    if (createdAt && !Number.isNaN(createdAt.getTime())) {
      return createdAt.toLocaleDateString();
    }

    if (typeof project?._id === 'string' && project._id.length >= 8) {
      const seconds = parseInt(project._id.substring(0, 8), 16);
      if (!Number.isNaN(seconds)) {
        return new Date(seconds * 1000).toLocaleDateString();
      }
    }

    return 'Recently';
  };

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => getProjectTime(b) - getProjectTime(a));
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
    <main className="relative min-h-screen overflow-hidden bg-[#06353b] text-[#ecf3f3]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(9,97,106,0.45),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(13,140,149,0.4),transparent_26%),radial-gradient(circle_at_80%_80%,rgba(26,180,181,0.36),transparent_26%)]" />

      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-8">
        <header className="rounded-2xl border border-[#d3d3d366] bg-[#0a4d55cc] p-5 backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#d3d3d3]">AI NexTalk</p>
              <h1 className="mt-2 text-2xl font-semibold text-[#f7f9f9] sm:text-3xl">
                Welcome, {user?.email}
              </h1>
              <p className="mt-2 text-sm text-[#d7e4e5]">
                Create or open a workspace to collaborate with your team and AI.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-xl bg-[#1ab3b5] px-4 py-2 text-sm font-semibold text-[#053137] transition hover:bg-[#24c2c5]"
              >
                New Project
              </button>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-xl border border-[#d3d3d388] px-4 py-2 text-sm font-semibold transition hover:bg-[#d3d3d322] disabled:opacity-60"
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-[#d3d3d366] bg-[#d3d3d322] px-4 py-3 text-sm text-[#e8efef]">
            {error}
          </div>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#f7f9f9] sm:text-xl">Your Projects</h2>
            <button
              onClick={fetchProjects}
              className="rounded-lg border border-[#d3d3d388] px-3 py-1.5 text-xs font-medium text-[#e4eded] transition hover:bg-[#d3d3d322]"
            >
              Refresh
            </button>
          </div>

          {isLoadingProjects ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, idx) => (
                <div
                  key={idx}
                  className="h-28 animate-pulse rounded-2xl border border-[#d3d3d355] bg-[#d3d3d322]"
                />
              ))}
            </div>
          ) : sortedProjects.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d3d3d388] bg-[#d3d3d322] p-8 text-center text-[#dfe9ea]">
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
                  className="group rounded-2xl border border-[#d3d3d355] bg-[#0c4c53cc] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#1ab3b5aa] hover:bg-[#d3d3d322]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-1 text-lg font-semibold text-[#f7f9f9]">{project.name}</h3>
                    <span className="rounded-md bg-[#1ab3b533] px-2 py-1 text-[11px] font-medium text-[#def4f4]">
                      Open
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[#d9e7e7]">
                    Created on {formatProjectDate(project)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-[#072b30cc] p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#d3d3d355] bg-[#0a4a52f2] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-[#f7f9f9]">Create Project</h2>
            <p className="mt-2 text-sm text-[#d8e5e6]">Give your workspace a clear, memorable name.</p>

            <form onSubmit={handleCreateProject} className="mt-5 space-y-4">
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                type="text"
                placeholder="e.g. Agentic Task Board"
                className="w-full rounded-xl border border-[#d3d3d388] bg-[#083c43] px-4 py-2.5 text-sm text-[#eff6f6] outline-none transition focus:border-[#1ab3b5] focus:ring-2 focus:ring-[#1ab3b555]"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-[#d3d3d388] px-4 py-2 text-sm text-[#e3eded] transition hover:bg-[#d3d3d322]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProject}
                  className="rounded-lg bg-[#1ab3b5] px-4 py-2 text-sm font-semibold text-[#053137] transition hover:bg-[#24c2c5] disabled:opacity-60"
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
