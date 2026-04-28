import { useEffect, useMemo, useState } from 'react';
import {
  Clock3,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  clearPickupPromo,
  clearPickupCart,
  getPickupCartTotals,
  getPickupCart,
  getPickupCartItemCount,
  getPickupPromo,
  getRecentPickupOrders,
  getSavedPickupCartSnapshot,
  PICKUP_CART_UPDATED_EVENT,
  removePickupCartItem,
  restoreSavedPickupCart,
  savePickupCartSnapshot,
  setPickupPromo,
  updatePickupCartQuantity,
} from '@/lib/pickupCart';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function PickupCartDrawer() {
  const [cart, setCart] = useState([]);
  const [open, setOpen] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState(null);
  const [promoMessage, setPromoMessage] = useState('');
  const [savedCart, setSavedCart] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    setCart(getPickupCart());
    setPromo(getPickupPromo());
    setSavedCart(getSavedPickupCartSnapshot());
    setRecentOrders(getRecentPickupOrders());

    function syncCart(event) {
      setCart(event.detail?.cart || getPickupCart());
      setPromo(getPickupPromo());
      setSavedCart(getSavedPickupCartSnapshot());
      setRecentOrders(getRecentPickupOrders());
    }

    window.addEventListener(PICKUP_CART_UPDATED_EVENT, syncCart);
    window.addEventListener('storage', syncCart);

    return () => {
      window.removeEventListener(PICKUP_CART_UPDATED_EVENT, syncCart);
      window.removeEventListener('storage', syncCart);
    };
  }, []);

  const itemCount = useMemo(() => getPickupCartItemCount(cart), [cart]);
  const totals = useMemo(() => getPickupCartTotals(cart, promo), [cart, promo]);

  function setQuantity(uid, quantity) {
    setCart(updatePickupCartQuantity(uid, quantity));
  }

  function removeItem(uid) {
    setCart(removePickupCartItem(uid));
  }

  function clearCart() {
    setCart(clearPickupCart());
    setPromo(clearPickupPromo());
    setPromoInput('');
    setPromoMessage('');
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

  function saveCartForLater() {
    savePickupCartSnapshot(cart);
    setSavedCart(getSavedPickupCartSnapshot());
  }

  function restoreCart() {
    setCart(restoreSavedPickupCart());
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          className='relative'
          type='button'
          size='sm'
          variant='outline'
          aria-label={`Open pickup cart with ${itemCount} item${itemCount === 1 ? '' : 's'}`}
        >
          <ShoppingBag className='size-4' aria-hidden='true' />
          <span className='hidden sm:inline'>Cart</span>
          {itemCount ? (
            <span className='absolute -right-2 -top-2 flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold leading-5 text-primary-foreground'>
              {itemCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent className='max-w-lg' title='Pickup cart'>
        <SheetHeader className='flex flex-row items-center justify-between gap-4 space-y-0'>
          <div className='flex items-center gap-2'>
            <ShoppingBag
              className='size-4 text-muted-foreground'
              aria-hidden='true'
            />
            <SheetTitle>Your Cart</SheetTitle>
            <span className='rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-muted-foreground'>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <SheetClose aria-label='Close cart' />
        </SheetHeader>

        <SheetBody className='p-0'>
          {cart.length ? (
            <ol className='divide-y divide-border'>
              {cart.map((item) => (
                <li
                  key={item.uid}
                  className='grid grid-cols-[4.5rem_1fr_auto] gap-3 px-5 py-4'
                >
                  <img
                    src={item.image || '/assets/images/menu/house-latte.webp'}
                    alt=''
                    className='size-16 rounded-md object-cover'
                    loading='lazy'
                  />
                  <div className='min-w-0'>
                    <p className='font-semibold leading-6 text-foreground'>
                      {item.name}
                    </p>
                    <p className='mt-1 text-sm leading-5 text-muted-foreground'>
                      {item.formatted}
                    </p>
                    <div className='mt-3 flex items-center gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        className='size-8 rounded-full'
                        onClick={() =>
                          item.quantity <= 1
                            ? removeItem(item.uid)
                            : setQuantity(item.uid, item.quantity - 1)
                        }
                        aria-label={`Decrease ${item.name} quantity`}
                      >
                        <Minus className='size-3.5' aria-hidden='true' />
                      </Button>
                      <span className='w-6 text-center text-sm font-semibold text-foreground'>
                        {item.quantity}
                      </span>
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        className='size-8 rounded-full'
                        onClick={() => setQuantity(item.uid, item.quantity + 1)}
                        aria-label={`Increase ${item.name} quantity`}
                      >
                        <Plus className='size-3.5' aria-hidden='true' />
                      </Button>
                    </div>
                  </div>
                  <div className='flex flex-col items-end justify-between gap-3'>
                    <span className='text-sm font-semibold text-foreground'>
                      {item.price}
                    </span>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='text-muted-foreground hover:text-red-600'
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
            <div className='flex min-h-80 flex-col items-center justify-center px-8 text-center'>
              <ShoppingBag
                className='size-10 text-muted-foreground'
                aria-hidden='true'
              />
              <p className='mt-4 font-semibold text-foreground'>
                Your pickup cart is empty.
              </p>
              <p className='mt-2 text-sm leading-6 text-muted-foreground'>
                Add drinks, breakfast, or pastries from the menu to start a
                pickup order.
              </p>
            </div>
          )}
        </SheetBody>

        <SheetFooter>
          {savedCart?.cart?.length && !cart.length ? (
            <div className='mb-4 rounded-lg border border-border bg-secondary/35 p-3 text-sm'>
              <p className='font-semibold text-foreground'>
                Saved cart available
              </p>
              <p className='mt-1 text-muted-foreground'>
                Restore {getPickupCartItemCount(savedCart.cart)} saved item
                {getPickupCartItemCount(savedCart.cart) === 1 ? '' : 's'} from
                this browser.
              </p>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='mt-3'
                onClick={restoreCart}
              >
                Restore Saved Cart
              </Button>
            </div>
          ) : null}

          <form className='mb-4 space-y-2' onSubmit={applyPromo}>
            <label
              className='flex items-center gap-2 text-sm font-medium text-foreground'
              htmlFor='pickup-promo-code'
            >
              <Tag
                className='size-4 text-muted-foreground'
                aria-hidden='true'
              />
              Promo code
            </label>
            <div className='flex gap-2'>
              <input
                id='pickup-promo-code'
                className='h-10 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-sm text-foreground shadow-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20'
                value={promoInput}
                onChange={(event) => setPromoInput(event.target.value)}
                placeholder='PRONTO10'
              />
              <Button type='submit' variant='outline' disabled={!cart.length}>
                Apply
              </Button>
            </div>
            {promo ? (
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span>{promo.label} active</span>
                <button
                  className='font-semibold text-foreground underline underline-offset-4'
                  type='button'
                  onClick={removePromo}
                >
                  Remove
                </button>
              </div>
            ) : promoMessage ? (
              <p className='text-xs text-muted-foreground'>{promoMessage}</p>
            ) : null}
          </form>

          <div className='space-y-2 text-sm'>
            <div className='flex items-center justify-between text-muted-foreground'>
              <span>Subtotal</span>
              <span className='font-semibold text-foreground'>
                {currencyFormatter.format(totals.subtotal)}
              </span>
            </div>
            {totals.discount ? (
              <div className='flex items-center justify-between text-muted-foreground'>
                <span>Promo discount</span>
                <span className='font-semibold text-green-700'>
                  -{currencyFormatter.format(totals.discount)}
                </span>
              </div>
            ) : null}
            <div className='flex items-center justify-between text-muted-foreground'>
              <span>Pickup</span>
              <span className='font-semibold text-green-700'>Free</span>
            </div>
            <div className='flex items-center justify-between text-muted-foreground'>
              <span>Estimated tax</span>
              <span className='font-semibold text-foreground'>
                {currencyFormatter.format(totals.tax)}
              </span>
            </div>
            <div className='flex items-center justify-between border-t border-border pt-3 text-base font-semibold text-foreground'>
              <span>Total</span>
              <span>{currencyFormatter.format(totals.total)}</span>
            </div>
          </div>
          <div className='mt-4 grid gap-2 rounded-lg border border-border bg-secondary/25 p-3 text-xs leading-5 text-muted-foreground'>
            <p className='flex items-center gap-2'>
              <CreditCard className='size-4 shrink-0' aria-hidden='true' />
              Pay at pickup when your order is confirmed by the counter.
            </p>
          </div>
          {recentOrders.length ? (
            <div className='mt-4 rounded-lg border border-border p-3 text-sm'>
              <p className='font-semibold text-foreground'>
                Recent pickup orders
              </p>
              <ol className='mt-2 space-y-1 text-xs text-muted-foreground'>
                {recentOrders.slice(0, 2).map((order) => (
                  <li
                    key={`${order.id}-${order.orderedAt}`}
                    className='flex justify-between gap-3'
                  >
                    <span>
                      {order.items.length} item
                      {order.items.length === 1 ? '' : 's'}
                    </span>
                    <span>{currencyFormatter.format(order.total)}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          <div className='mt-5 grid gap-2'>
            <Button
              as='a'
              href='/order-ahead/'
              className='w-full'
              onClick={() => setOpen(false)}
            >
              Continue to Pickup
            </Button>
            <div className='grid grid-cols-1 gap-2'>
              <Button
                type='button'
                variant='ghost'
                onClick={clearCart}
                disabled={!cart.length}
              >
                Clear
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
