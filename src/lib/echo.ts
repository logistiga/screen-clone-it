import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as any).Pusher = Pusher;

// Enable Pusher debug logging in development
if (import.meta.env.DEV) {
  Pusher.logToConsole = true;
}

const echo = new Echo({
  broadcaster: 'pusher',
  key: import.meta.env.VITE_PUSHER_APP_KEY || 'f58a72a4b49731f59fa9',
  cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'eu',
  forceTLS: true,
});

console.log('[Echo] Initialized with key:', import.meta.env.VITE_PUSHER_APP_KEY || 'f58a72a4b49731f59fa9', 'cluster:', import.meta.env.VITE_PUSHER_APP_CLUSTER || 'eu');

export default echo;
