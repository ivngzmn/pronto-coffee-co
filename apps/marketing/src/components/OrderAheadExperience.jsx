import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus, Tag, Trash2 } from 'lucide-react';
import {
  defaultLocation,
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
import {
  addPickupCartItem,
  clearPickupPromo,
  clearPickupCart,
  formatCartLineForOrder,
  getPickupCart,
  getPickupCartTotals,
  getPickupPromo,
  PICKUP_CART_UPDATED_EVENT,
  removePickupCartItem,
  saveRecentPickupOrder,
  setPickupPromo,
  updatePickupCartQuantity,
} from '@/lib/pickupCart';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const defaultCategoryId = orderingCategories[0]?.id || '';
const defaultItemId = orderingCategories[0]?.items[0]?.id || '';
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
  const [selectedItemId, setSelectedItemId] = useState(defaultItemId);
  const [size, setSize] = useState(defaultSize);
  const [milk, setMilk] = useState(defaultMilk);
  const [ticket, setTicket] = useState([]);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState(null);
  const [promoMessage, setPromoMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const activeCategory = useMemo(
    () =>
      orderingCategories.find((category) => category.id === activeCategoryId) ||
      orderingCategories[0],
    [activeCategoryId],
  );
  const selectedItem = useMemo(
    () =>
      activeCategory?.items.find((item) => item.id === selectedItemId) ||
      activeCategory?.items[0],
    [activeCategory?.items, selectedItemId],
  );
  const totals = useMemo(() => getPickupCartTotals(ticket, promo), [ticket, promo]);

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

  useEffect(() => {
    if (session.loading || !session.authenticated || session.user?.role !== 'customer') {
      return undefined;
    }

    setTicket(getPickupCart());
    setPromo(getPickupPromo());

    function syncTicket(event) {
      setTicket(event.detail?.cart || getPickupCart());
      setPromo(getPickupPromo());
    }

    window.addEventListener(PICKUP_CART_UPDATED_EVENT, syncTicket);

    return () => {
      window.removeEventListener(PICKUP_CART_UPDATED_EVENT, syncTicket);
    };
  }, [session.authenticated, session.loading, session.user?.role]);

  function addItem(item) {
    if (!item) return;

    const nextCart = addPickupCartItem(item, {
      size: item.sizes?.length ? size : '',
      temperature:
        item.temperatureOptions?.length > 1
          ? item.temperatureOptions[0]
          : item.temperatureOptions?.[0] || '',
      milk: item.milkOptions?.length ? milk : '',
    });

    setTicket(nextCart);
    setError('');
    setSuccess('');
  }

  function addSelectedItem() {
    addItem(selectedItem);
  }

  function removeItem(uid) {
    setTicket(removePickupCartItem(uid));
  }

  function setItemQuantity(item, quantity) {
    if (quantity < 1) {
      setTicket(removePickupCartItem(item.uid));
      return;
    }

    setTicket(updatePickupCartQuantity(item.uid, quantity));
  }

  function applyPromo(event) {
    event.preventDefault();
    const nextPromo = setPickupPromo(promoInput);
    setPromo(nextPromo);
    setPromoMessage(
      nextPromo ? `${nextPromo.code} applied.` : 'Enter PRONTO10 or PICKUP5.',
    );
  }

  function removePromo() {
    setPromo(clearPickupPromo());
    setPromoInput('');
    setPromoMessage('');
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
          order: ticket.map(formatCartLineForOrder),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to place the order right now.');
      }

      saveRecentPickupOrder(ticket, data.order);
      setTicket(clearPickupCart());
      clearPickupPromo();
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
      setTicket(clearPickupCart());
      clearPickupPromo();
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
                {ticket.map((item) => (
                  <li
                    key={item.uid}
                    className='grid grid-cols-[3.5rem_1fr_auto] gap-3 rounded-lg bg-white/10 px-3 py-3'
                  >
                    <img
                      src={item.image}
                      alt=''
                      className='size-14 rounded-md object-cover'
                      loading='lazy'
                    />
                    <div className='min-w-0'>
                      <span className='block text-sm font-semibold text-white'>
                        {item.name}
                      </span>
                      <span className='mt-1 block text-xs leading-5 text-stone-300'>
                        {item.formatted}
                      </span>
                      <div className='mt-3 flex items-center gap-2'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='size-8 rounded-full border border-white/15 text-stone-300 hover:bg-white/10 hover:text-white'
                          onClick={() => setItemQuantity(item, item.quantity - 1)}
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          <Minus className='size-3.5' aria-hidden='true' />
                        </Button>
                        <span className='w-6 text-center text-sm font-semibold text-white'>
                          {item.quantity}
                        </span>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='size-8 rounded-full border border-white/15 text-stone-300 hover:bg-white/10 hover:text-white'
                          onClick={() => setItemQuantity(item, item.quantity + 1)}
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          <Plus className='size-3.5' aria-hidden='true' />
                        </Button>
                      </div>
                    </div>
                    <div className='flex flex-col items-end justify-between gap-3'>
                      <span className='text-sm font-semibold text-white'>
                        {item.price}
                      </span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='text-stone-300 hover:bg-white/10 hover:text-red-200'
                        onClick={() => removeItem(item.uid)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className='size-4' aria-hidden='true' />
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className='mt-3 text-stone-300'>
                Choose coffee, breakfast, or pastries to build the order.
              </p>
            )}
            <form className='mt-4 space-y-2 border-t border-white/10 pt-4' onSubmit={applyPromo}>
              <label
                className='flex items-center gap-2 text-sm font-medium text-white'
                htmlFor='order-ahead-promo-code'
              >
                <Tag className='size-4 text-stone-300' aria-hidden='true' />
                Promo code
              </label>
              <div className='flex gap-2'>
                <input
                  id='order-ahead-promo-code'
                  className='h-10 min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white shadow-sm outline-none placeholder:text-stone-400 focus:border-white/40 focus:ring-2 focus:ring-white/15'
                  value={promoInput}
                  onChange={(event) => setPromoInput(event.target.value)}
                  placeholder='PRONTO10'
                />
                <Button
                  type='submit'
                  variant='ghost'
                  className='border border-white/15 text-white hover:bg-white/10 hover:text-white'
                  disabled={!ticket.length}
                >
                  Apply
                </Button>
              </div>
              {promo ? (
                <div className='flex items-center justify-between text-xs text-stone-300'>
                  <span>{promo.label} active</span>
                  <button
                    className='font-semibold text-white underline underline-offset-4'
                    type='button'
                    onClick={removePromo}
                  >
                    Remove
                  </button>
                </div>
              ) : promoMessage ? (
                <p className='text-xs text-stone-300'>{promoMessage}</p>
              ) : null}
            </form>
            <div className='mt-4 space-y-2 border-t border-white/10 pt-4 text-sm'>
              <div className='flex items-center justify-between text-stone-300'>
                <span>Subtotal</span>
                <span className='font-semibold text-white'>
                  {currencyFormatter.format(totals.subtotal)}
                </span>
              </div>
              {totals.discount ? (
                <div className='flex items-center justify-between text-stone-300'>
                  <span>Promo discount</span>
                  <span className='font-semibold text-green-200'>
                    -{currencyFormatter.format(totals.discount)}
                  </span>
                </div>
              ) : null}
              <div className='flex items-center justify-between text-stone-300'>
                <span>Pickup</span>
                <span className='font-semibold text-green-200'>Free</span>
              </div>
              <div className='flex items-center justify-between text-stone-300'>
                <span>Estimated tax</span>
                <span className='font-semibold text-white'>
                  {currencyFormatter.format(totals.tax)}
                </span>
              </div>
              <div className='flex items-center justify-between border-t border-white/10 pt-3 text-base font-semibold text-white'>
                <span>Total</span>
                <span>{currencyFormatter.format(totals.total)}</span>
              </div>
            </div>
            {error ? (
              <Alert className='mt-4' variant='destructive'>
                {error}
              </Alert>
            ) : null}
            {success ? (
              <Alert className='mt-4' variant='success'>
                {success}
              </Alert>
            ) : null}
            <div className='mt-4 flex flex-wrap gap-3'>
              <Button
                type='button'
                onClick={submitOrder}
                disabled={pending || missingPhone || ticket.length === 0}
              >
                {pending ? 'Sending Order...' : 'Send Pickup Order'}
              </Button>
              {success ? (
                <Button type='button' variant='outline' onClick={handleLogout}>
                  Log out
                </Button>
              ) : null}
            </div>
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
              if (nextCategory) {
                setActiveCategoryId(nextCategory.id);
                setSelectedItemId(nextCategory.items[0]?.id || '');
              }
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
            {activeCategory?.items.map((item) => {
              const isSelected = selectedItem?.id === item.id;

              return (
                <Button
                  key={item.id}
                  className={
                    isSelected
                      ? 'h-auto whitespace-normal rounded-lg px-4 py-4 text-left ring-2 ring-ring/20'
                      : 'h-auto whitespace-normal rounded-lg border-border bg-secondary/30 px-4 py-4 text-left hover:bg-secondary/60'
                  }
                  variant={isSelected ? 'default' : 'outline'}
                  type='button'
                  onClick={() => setSelectedItemId(item.id)}
                >
                  <span className='flex items-start gap-3'>
                    <img
                      src={item.image}
                      alt=''
                      className='size-16 shrink-0 rounded-md object-cover'
                      loading='lazy'
                    />
                    <span>
                      <span className={isSelected ? 'block font-semibold text-white' : 'block font-semibold text-foreground'}>
                        {item.name}
                      </span>
                      <span className={isSelected ? 'mt-1 block text-xs leading-5 text-white/75' : 'mt-1 block text-xs leading-5 text-muted-foreground'}>
                        {item.description}
                      </span>
                      <span className={isSelected ? 'mt-2 block text-sm leading-6 text-white/80' : 'mt-2 block text-sm leading-6 text-muted-foreground'}>
                        {item.basePrice}
                      </span>
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>

          <div className='flex flex-wrap gap-3'>
            <Button
              type='button'
              onClick={addSelectedItem}
              disabled={!selectedItem}
            >
              Add to Cart
            </Button>
            <Button as='a' href='/menu/' variant='outline'>
              Browse Full Menu
            </Button>
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
