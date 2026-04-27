import { useEffect, useMemo, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

function normalizeApiUrl(apiUrl) {
  return apiUrl.replace(/\/$/, '');
}

function nextPath() {
  if (typeof window === 'undefined') return '/order-ahead/';

  const params = new URLSearchParams(window.location.search);
  const next = params.get('next') || '/order-ahead/';
  return next.startsWith('/') ? next : '/order-ahead/';
}

export function CustomerAuthExperience({ apiUrl }) {
  const [mode, setMode] = useState('login');
  const [session, setSession] = useState({
    loading: true,
    authenticated: false,
    user: null,
  });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const destination = useMemo(() => nextPath(), []);

  useEffect(() => {
    let ignore = false;

    fetch(`${normalizeApiUrl(apiUrl)}/api/session`, { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (!ignore) setSession({ loading: false, ...data });
      })
      .catch(() => {
        if (!ignore)
          setSession({ loading: false, authenticated: false, user: null });
      });

    return () => {
      ignore = true;
    };
  }, [apiUrl]);

  useEffect(() => {
    if (session.authenticated && session.user?.role === 'customer') {
      window.location.assign(destination);
    }
  }, [destination, session.authenticated, session.user?.role]);

  async function submit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const path =
      mode === 'signup'
        ? '/api/customer/auth/signup'
        : '/api/customer/auth/login';

    setPending(true);
    setError('');

    try {
      const response = await fetch(`${normalizeApiUrl(apiUrl)}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: formData.get('userName'),
          email: formData.get('email'),
          password: formData.get('password'),
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to continue.');
      }

      setSession({ loading: false, authenticated: true, user: data.user });
      window.location.assign(destination);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className='grid min-h-full xl:min-h-[calc(100vh-16rem)] mx-auto gap-10 px-4 py-16 md:px-6 lg:grid-cols-[0.95fr_1.05fr] max-w-7xl'>
      <section className='hidden space-y-6 border-r border-border pr-10 lg:block'>
        <div className='inline-flex rounded-md bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground'>
          Order Ahead
        </div>
        <h1 className='max-w-xl text-5xl font-semibold leading-tight text-primary'>
          Skip the line, savor the ritual.
        </h1>
        <p className='max-w-md text-base leading-8 text-muted-foreground'>
          Create a Pronto customer account to send pickup orders into the same
          live queue our baristas use at the counter.
        </p>
        <div className='grid gap-4'>
          {[
            [
              'Instant Pickup',
              'Build your order before you arrive and keep your morning moving.',
            ],
            [
              'Protected Queue',
              'Signed-in orders help the team keep spam out of the barista workflow.',
            ],
          ].map(([title, description]) => (
            <div
              key={title}
              className='rounded-lg border border-border bg-white p-4'
            >
              <p className='font-semibold text-primary'>{title}</p>
              <p className='mt-1 text-sm leading-6 text-muted-foreground'>
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Card className='mx-auto w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-3xl'>
            {mode === 'signup' ? 'Create an account' : 'Welcome back'}
          </CardTitle>
          <CardDescription>
            {mode === 'signup'
              ? 'Create your customer account to start sending pickup orders.'
              : 'Enter your customer credentials to access order ahead.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className='space-y-4' onSubmit={submit}>
            {mode === 'signup' ? (
              <Field label='Name'>
                <Input
                  name='userName'
                  required
                  placeholder='Taylor'
                  autoComplete='name'
                />
              </Field>
            ) : null}
            <Field label='Email'>
              <Input
                name='email'
                type='email'
                required
                placeholder='name@example.com'
                autoComplete='email'
              />
            </Field>
            <Field label='Password'>
              <Input
                name='password'
                type='password'
                required
                placeholder={
                  mode === 'signup' ? 'Create a password' : 'Your password'
                }
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
              />
            </Field>
            {error ? <Alert variant='destructive'>{error}</Alert> : null}
            <Button
              className='w-full'
              type='submit'
              disabled={pending || session.loading}
            >
              {pending
                ? 'Working...'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Login'}
            </Button>
          </form>
          <p className='mt-6 text-center text-sm text-muted-foreground'>
            {mode === 'signup'
              ? 'Already have an account?'
              : "Don't have an account?"}{' '}
            <button
              className='font-semibold text-primary underline underline-offset-4'
              type='button'
              onClick={() => {
                setError('');
                setMode(mode === 'signup' ? 'login' : 'signup');
              }}
            >
              {mode === 'signup' ? 'Login' : 'Create one'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
