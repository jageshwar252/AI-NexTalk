import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user-context';

const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      const response = await axios.post('/users/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(45,212,191,0.2),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(251,146,60,0.18),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.18),transparent_30%)]" />

      <div className="relative mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <section className="hidden rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl lg:block">
          <p className="text-xs uppercase tracking-[0.3em] text-teal-200/80">AI NexTalk</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Collaborative AI workspace for teams that ship fast
          </h1>
          <p className="mt-4 text-slate-300">
            Build, discuss, and iterate with your teammates and AI in one smooth workflow.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/85 p-7 shadow-2xl backdrop-blur-xl sm:p-10">
          <h2 className="text-3xl font-semibold">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-300">Sign in to continue to your projects.</p>

          <form onSubmit={submitHandler} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm text-slate-200">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-2.5 text-sm outline-none transition focus:border-teal-300/60 focus:ring-2 focus:ring-teal-400/20"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm text-slate-200">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-2.5 text-sm outline-none transition focus:border-teal-300/60 focus:ring-2 focus:ring-teal-400/20"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg border border-rose-400/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-teal-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-teal-300 disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-300">
            No account yet?{' '}
            <Link to="/register" className="font-semibold text-teal-300 hover:text-teal-200">
              Create one
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;
