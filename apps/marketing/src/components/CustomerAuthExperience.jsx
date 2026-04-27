import { useEffect, useMemo, useState } from 'react';
import { CircleStar, Zap } from 'lucide-react';
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
import { formatPhoneNumber } from '@/lib/utils';

function normalizeApiUrl(apiUrl) {
  return apiUrl.replace(/\/$/, '');
}

function nextPath() {
  if (typeof window === 'undefined') return '/order-ahead/';

  const params = new URLSearchParams(window.location.search);
  const next = params.get('next') || '/order-ahead/';
  return next.startsWith('/') ? next : '/order-ahead/';
}

const authShellClass =
  'mx-auto grid min-h-full max-w-7xl gap-6 px-4 py-16 md:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20 xl:min-h-[calc(100vh-16rem)]';
const authFormCardClass =
  'mx-auto w-full max-w-full self-start lg:mt-0 lg:min-h-[36rem]';

export function CustomerAuthExperience({ apiUrl }) {
  const [mode, setMode] = useState('login');
  const [session, setSession] = useState({
    loading: true,
    authenticated: false,
    user: null,
  });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [phone, setPhone] = useState('');
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
          phone: formData.get('phone'),
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

  if (session.loading) {
    return <CustomerAuthSkeleton />;
  }

  return (
    <div className={authShellClass}>
      <AuthPickupPanel />

      <Card className={authFormCardClass}>
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
              <>
                <Field label='Name'>
                  <Input
                    name='userName'
                    required
                    placeholder='Taylor'
                    autoComplete='name'
                  />
                </Field>
                <Field label='Phone'>
                  <Input
                    name='phone'
                    type='tel'
                    required
                    inputMode='numeric'
                    value={phone}
                    onChange={(event) =>
                      setPhone(formatPhoneNumber(event.target.value))
                    }
                    placeholder='(714) 555-1234'
                    autoComplete='tel'
                  />
                </Field>
              </>
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
                  : 'Sign in'}
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
                setPhone('');
                setMode(mode === 'signup' ? 'login' : 'signup');
              }}
            >
              {mode === 'signup' ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AuthPickupPanel() {
  return (
    <Card className='overflow-hidden border-border/70 bg-primary text-primary-foreground'>
      <CardHeader className='space-y-4'>
        <div className='inline-flex w-fit rounded-md bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-100'>
          Order Ahead
        </div>
        <CardTitle className='text-4xl text-white md:text-5xl'>
          Skip the line, savor the ritual.
        </CardTitle>
        <CardDescription className='text-base leading-7 text-stone-300'>
          Create a Pronto customer account to send pickup orders into the same
          live queue our baristas use at the counter.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4 text-sm leading-7 text-stone-200'>
        <FeatureBlock
          icon={Zap}
          title='Instant Pickup'
          description='Build your order before you arrive and keep your morning moving.'
        />
        <FeatureBlock
          icon={CircleStar}
          title='Exclusive Access'
          description='Access limited small-batch roasts and member-only brewing workshops.'
        />
      </CardContent>
    </Card>
  );
}

function FeatureBlock({ icon: Icon, title, description }) {
  return (
    <div className='rounded-lg bg-white/5 p-4'>
      <p className='flex items-center gap-2 font-semibold text-white'>
        {Icon ? <Icon className='size-4 shrink-0' aria-hidden='true' /> : null}
        <span>{title}</span>
      </p>
      <p className='mt-1 text-stone-300'>{description}</p>
    </div>
  );
}

function CustomerAuthSkeleton() {
  return (
    <div
      className={authShellClass}
      aria-busy='true'
      aria-label='Loading customer sign in'
    >
      <Card className='overflow-hidden border-border/70 bg-primary text-primary-foreground'>
        <CardHeader className='space-y-4'>
          <div className='h-6 w-28 animate-pulse rounded-md bg-white/15' />
          <div className='space-y-3'>
            <div className='h-11 w-11/12 animate-pulse rounded-md bg-white/15' />
            <div className='h-11 w-3/4 animate-pulse rounded-md bg-white/15' />
          </div>
          <div className='space-y-2'>
            <div className='h-4 w-full animate-pulse rounded bg-white/10' />
            <div className='h-4 w-10/12 animate-pulse rounded bg-white/10' />
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {[0, 1].map((item) => (
            <div key={item} className='rounded-lg bg-white/5 p-4'>
              <div className='h-4 w-36 animate-pulse rounded bg-white/15' />
              <div className='mt-3 h-4 w-11/12 animate-pulse rounded bg-white/10' />
            </div>
          ))}
          <div className='rounded-lg bg-white/5 p-4'>
            <div className='h-4 w-40 animate-pulse rounded bg-white/15' />
            <div className='mt-3 h-4 w-full animate-pulse rounded bg-white/10' />
            <div className='mt-2 h-4 w-9/12 animate-pulse rounded bg-white/10' />
          </div>
        </CardContent>
      </Card>

      <Card className={authFormCardClass}>
        <CardHeader>
          <div className='h-8 w-52 animate-pulse rounded-md bg-secondary' />
          <div className='h-4 w-11/12 animate-pulse rounded bg-secondary' />
        </CardHeader>
        <CardContent className='space-y-4'>
          {[0, 1].map((field) => (
            <div key={field} className='space-y-2'>
              <div className='h-4 w-20 animate-pulse rounded bg-secondary' />
              <div className='h-11 w-full animate-pulse rounded-md bg-secondary' />
            </div>
          ))}
          <div className='h-11 w-full animate-pulse rounded-md bg-primary/20' />
          <div className='mx-auto h-4 w-56 animate-pulse rounded bg-secondary' />
        </CardContent>
      </Card>
    </div>
  );
}
