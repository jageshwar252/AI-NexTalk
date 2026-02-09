import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user-context';

const Register = () => {
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
      const res = await axios.post('/users/register', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(251,146,60,0.18),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(45,212,191,0.2),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(148,163,184,0.18),transparent_30%)]" />

      <div className="relative mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        <section className="hidden rounded-3xl border border-white/10 bg-white/5 p-10 backdrop-blur-xl lg:block">
          <p className="text-xs uppercase tracking-[0.3em] text-orange-200/80">AI NexTalk</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight">
            Spin up a new collaboration space in seconds
          </h1>
          <p className="mt-4 text-slate-300">
            Register once, then manage projects, teams, and AI-assisted workflows from one place.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/85 p-7 shadow-2xl backdrop-blur-xl sm:p-10">
          <h2 className="text-3xl font-semibold">Create Account</h2>
          <p className="mt-2 text-sm text-slate-300">Start building with your team today.</p>

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
                className="w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-2.5 text-sm outline-none transition focus:border-orange-300/60 focus:ring-2 focus:ring-orange-400/20"
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
                className="w-full rounded-xl border border-white/15 bg-slate-900 px-4 py-2.5 text-sm outline-none transition focus:border-orange-300/60 focus:ring-2 focus:ring-orange-400/20"
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
              className="w-full rounded-xl bg-orange-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-orange-300 disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-300">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-orange-300 hover:text-orange-200">
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Register;
