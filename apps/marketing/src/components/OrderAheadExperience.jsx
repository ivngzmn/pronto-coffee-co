import { useEffect, useMemo, useState } from 'react';
import {
  defaultLocation,
  formatOrderItem,
  orderingCategories,
} from '@pronto/menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { formatPhoneNumber } from '@/lib/utils';

const defaultCategoryId = orderingCategories[0]?.id || '';
const defaultSize = 'Medium';
const defaultMilk = 'Whole';

export function OrderAheadExperience({ apiUrl }) {
  const normalizedApiUrl = apiUrl.replace(/\/$/, '');
  const [session, setSession] = useState({
    loading: true,
    authenticated: false,
    user: null,
  });
  const [activeCategoryId, setActiveCategoryId] = useState(defaultCategoryId);
  const [size, setSize] = useState(defaultSize);
  const [milk, setMilk] = useState(defaultMilk);
  const [ticket, setTicket] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activeCategory = useMemo(
    () =>
      orderingCategories.find((category) => category.id === activeCategoryId) ||
      orderingCategories[0],
    [activeCategoryId],
  );

  useEffect(() => {
    let ignore = false;

    fetch(`${normalizedApiUrl}/api/session`, { credentials: 'include' })
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
  }, [normalizedApiUrl]);

  useEffect(() => {
    if (
      !session.loading &&
      (!session.authenticated || session.user?.role !== 'customer') &&
      typeof window !== 'undefined'
    ) {
      window.location.assign('/customer-login/?next=/order-ahead/');
    }
  }, [session.authenticated, session.loading, session.user?.role]);

  function addItem(item) {
    const formatted = formatOrderItem(item, {
      size: item.sizes?.length ? size : '',
      milk: item.milkOptions?.length ? milk : '',
      temperature:
        item.temperatureOptions?.length > 1
          ? item.temperatureOptions[0]
          : item.temperatureOptions?.[0] || '',
    });

    setTicket((current) => [
      ...current,
      {
        uid: `${item.id}-${Date.now()}-${Math.random()}`,
        id: item.id,
        name: item.name,
        description: item.description,
        image: item.image,
        price: item.basePrice,
        formatted,
      },
    ]);
    setError('');
    setSuccess('');
  }

  function removeItem(index) {
    setTicket((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  async function submitOrder() {
    const customerName = session.user?.userName || session.user?.email || '';
    const customerPhone = formatPhoneNumber(session.user?.phone);

    if (!customerName || !customerPhone || ticket.length === 0) {
      setError(
        'Your customer account needs a name, phone number, and at least one item before sending the order.',
      );
      return;
    }

    if (!session.authenticated) {
      setError('Sign in or create a customer account before sending the order.');
      return;
    }

    setPending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${normalizedApiUrl}/api/order-ahead`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customerName,
          customerPhone,
          order: ticket.map((item) => item.formatted),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to place the order right now.');
      }

      setTicket([]);
      setSuccess(
        `Order sent to ${defaultLocation.name}. The team can now see it in the pickup queue.`,
      );
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setPending(false);
    }
  }

  async function handleLogout() {
    setPending(true);
    setError('');

    try {
      await fetch(`${normalizedApiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // The session cookie is cleared server-side when possible; continue locally.
    } finally {
      setSession({ loading: false, authenticated: false, user: null });
      setTicket([]);
      setPending(false);

      if (typeof window !== 'undefined') {
        window.location.assign('/customer-login/?next=/order-ahead/');
      }
    }
  }

  if (session.loading) {
    return <OrderAheadSkeleton />;
  }

  if (!session.authenticated || session.user?.role !== 'customer') {
    return <OrderAheadSkeleton />;
  }

  const customerName = session.user?.userName || session.user?.email || '';
  const customerPhone = formatPhoneNumber(session.user?.phone);
  const missingPhone = !customerPhone;

  return (
    <div className='grid gap-6 lg:grid-cols-[0.9fr_1.1fr]'>
      <Card className='overflow-hidden border-border/70 bg-primary text-primary-foreground'>
        <CardHeader className='space-y-4'>
          <Badge className='w-fit bg-white/10 text-stone-100'>
            Order Ahead
          </Badge>
          <CardTitle className='text-4xl text-white'>
            Skip the line and have your coffee waiting.
          </CardTitle>
          <CardDescription className='text-base leading-7 text-stone-300'>
            Build a pickup order for {defaultLocation.name}, send it through,
            and the team will see it in the same queue they use at the register.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6 text-sm leading-7 text-stone-200'>
          <div>
            <p className='font-semibold text-white'>{defaultLocation.name}</p>
            {defaultLocation.addressLines.map((line) => (
              <p key={line} className='mt-1'>
                {line}
              </p>
            ))}
          </div>
          <div>
            <p className='font-semibold text-white'>Hours</p>
            <p className='mt-1'>{defaultLocation.hours}</p>
          </div>
          <div>
            <p className='font-semibold text-white'>Pickup favorites</p>
            <p className='mt-1'>
              House lattes, cold brew, breakfast sandwiches, avocado toast, and
              pastry case add-ons for the quick coffee run.
            </p>
          </div>
          <div className='rounded-lg bg-white/5 p-4'>
            <p className='text-xs uppercase tracking-[0.2em] text-stone-300'>
              Current ticket
            </p>
            {ticket.length ? (
              <ol className='mt-3 space-y-2'>
                {ticket.map((item, index) => (
                  <li
                    key={item.uid}
                    className='flex items-start justify-between gap-3 rounded-lg bg-white/10 px-3 py-3'
                  >
                    <span className='flex min-w-0 gap-3'>
                      <img
                        src={item.image}
                        alt=''
                        className='size-14 shrink-0 rounded-md object-cover'
                        loading='lazy'
                      />
                      <span className='min-w-0'>
                        <span className='block text-sm font-semibold text-white'>
                          {item.formatted}
                        </span>
                        <span className='mt-1 block text-xs leading-5 text-stone-300'>
                          {item.description}
                        </span>
                      </span>
                    </span>
                    <Button
                      className='h-auto shrink-0 px-2 py-1 text-xs uppercase tracking-[0.2em] text-stone-300 hover:bg-white/10 hover:text-white'
                      variant='ghost'
                      type='button'
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className='mt-3 text-stone-300'>
                Choose coffee, breakfast, or pastries to build the order.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Badge className='w-fit'>Pickup Builder</Badge>
          <CardTitle className='text-3xl'>
            Choose drinks and breakfast for pickup
          </CardTitle>
          <CardDescription className='text-base leading-7'>
            Pick a category, add items, and send the order straight Pronto Costa
            Mesa.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid gap-3 rounded-lg border border-border bg-secondary/30 p-4 text-sm md:grid-cols-2'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                Ordering as
              </p>
              <p className='mt-1 font-semibold text-foreground'>
                {customerName}
              </p>
            </div>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground'>
                Phone
              </p>
              <p className='mt-1 font-semibold text-foreground'>
                {customerPhone || 'Phone required'}
              </p>
            </div>
          </div>
          {missingPhone ? (
            <Alert variant='destructive'>
              Your customer account is missing a phone number. Please create a
              new customer account with a phone number before using order ahead.
            </Alert>
          ) : null}

          <OptionGroup
            label='Category'
            options={orderingCategories.map((category) => category.title)}
            value={activeCategory?.title || ''}
            onChange={(title) => {
              const nextCategory = orderingCategories.find(
                (category) => category.title === title,
              );
              if (nextCategory) setActiveCategoryId(nextCategory.id);
            }}
          />
          <OptionGroup
            label='Size'
            options={['Small', 'Medium', 'Large']}
            value={size}
            onChange={setSize}
          />
          <OptionGroup
            label='Milk'
            options={['Whole', 'Oat', 'Almond', 'Soy']}
            value={milk}
            onChange={setMilk}
          />

          <div className='grid gap-3 sm:grid-cols-2'>
            {activeCategory?.items.map((item) => (
              <Button
                key={item.id}
                className='h-auto whitespace-normal rounded-lg border-border bg-secondary/30 px-4 py-4 text-left hover:bg-secondary/60'
                variant='outline'
                type='button'
                onClick={() => addItem(item)}
              >
                <span className='flex items-start gap-3'>
                  <img
                    src={item.image}
                    alt=''
                    className='size-16 shrink-0 rounded-md object-cover'
                    loading='lazy'
                  />
                  <span>
                    <span className='block font-semibold text-foreground'>
                      {item.name}
                    </span>
                    <span className='mt-1 block text-xs leading-5 text-muted-foreground'>
                      {item.description}
                    </span>
                    <span className='mt-2 block text-sm leading-6 text-muted-foreground'>
                      {item.basePrice}
                    </span>
                  </span>
                </span>
              </Button>
            ))}
          </div>

          {error ? <Alert variant='destructive'>{error}</Alert> : null}
          {success ? <Alert variant='success'>{success}</Alert> : null}

          <div className='flex flex-wrap gap-3'>
            <Button
              type='button'
              onClick={submitOrder}
              disabled={pending || missingPhone}
            >
              {pending ? 'Sending Order...' : 'Send Pickup Order'}
            </Button>
            <Button as='a' href='/menu/' variant='outline'>
              Browse Full Menu
            </Button>
            {success ? (
              <Button type='button' variant='outline' onClick={handleLogout}>
                Log out
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OrderAheadSkeleton() {
  const itemRows = Array.from({ length: 6 }, (_, index) => index);

  return (
    <div
      className='grid gap-6 lg:grid-cols-[0.9fr_1.1fr]'
      aria-busy='true'
      aria-label='Loading order ahead'
    >
      <Card className='overflow-hidden border-border/70 bg-primary text-primary-foreground'>
        <CardHeader className='space-y-4'>
          <div className='h-6 w-28 animate-pulse rounded-md bg-white/15' />
          <div className='space-y-3'>
            <div className='h-10 w-11/12 animate-pulse rounded-md bg-white/15' />
            <div className='h-10 w-3/4 animate-pulse rounded-md bg-white/15' />
          </div>
          <div className='space-y-2'>
            <div className='h-4 w-full animate-pulse rounded bg-white/10' />
            <div className='h-4 w-10/12 animate-pulse rounded bg-white/10' />
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-3'>
            <div className='h-4 w-36 animate-pulse rounded bg-white/15' />
            <div className='h-4 w-52 animate-pulse rounded bg-white/10' />
            <div className='h-4 w-44 animate-pulse rounded bg-white/10' />
          </div>
          <div className='space-y-3'>
            <div className='h-4 w-20 animate-pulse rounded bg-white/15' />
            <div className='h-4 w-40 animate-pulse rounded bg-white/10' />
          </div>
          <div className='rounded-lg bg-white/5 p-4'>
            <div className='h-4 w-32 animate-pulse rounded bg-white/15' />
            <div className='mt-4 h-16 animate-pulse rounded-lg bg-white/10' />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='h-6 w-32 animate-pulse rounded-md bg-secondary' />
          <div className='space-y-3'>
            <div className='h-8 w-10/12 animate-pulse rounded-md bg-secondary' />
            <div className='h-8 w-7/12 animate-pulse rounded-md bg-secondary' />
          </div>
          <div className='h-4 w-11/12 animate-pulse rounded bg-secondary' />
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid gap-3 rounded-lg border border-border bg-secondary/30 p-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <div className='h-3 w-24 animate-pulse rounded bg-secondary' />
              <div className='h-5 w-36 animate-pulse rounded bg-secondary' />
            </div>
            <div className='space-y-2'>
              <div className='h-3 w-16 animate-pulse rounded bg-secondary' />
              <div className='h-5 w-32 animate-pulse rounded bg-secondary' />
            </div>
          </div>

          {[0, 1, 2].map((group) => (
            <div key={group} className='space-y-3'>
              <div className='h-4 w-20 animate-pulse rounded bg-secondary' />
              <div className='flex flex-wrap gap-2'>
                {[0, 1, 2, 3].map((option) => (
                  <div
                    key={option}
                    className='h-9 w-20 animate-pulse rounded-lg bg-secondary'
                  />
                ))}
              </div>
            </div>
          ))}

          <div className='grid gap-3 sm:grid-cols-2'>
            {itemRows.map((item) => (
              <div
                key={item}
                className='flex min-h-28 gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-4'
              >
                <div className='size-16 shrink-0 animate-pulse rounded-md bg-secondary' />
                <div className='w-full space-y-2'>
                  <div className='h-4 w-8/12 animate-pulse rounded bg-secondary' />
                  <div className='h-3 w-full animate-pulse rounded bg-secondary' />
                  <div className='h-3 w-10/12 animate-pulse rounded bg-secondary' />
                  <div className='h-4 w-16 animate-pulse rounded bg-secondary' />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OptionGroup({ label, options, value, onChange }) {
  return (
    <div className='space-y-3'>
      <p className='text-sm font-medium text-foreground'>{label}</p>
      <div className='flex flex-wrap gap-2'>
        {options.map((option) => (
          <Button
            key={option}
            className={
              value === option
                ? 'rounded-lg'
                : 'rounded-lg text-muted-foreground'
            }
            variant={value === option ? 'default' : 'outline'}
            size='sm'
            type='button'
            onClick={() => onChange(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}
