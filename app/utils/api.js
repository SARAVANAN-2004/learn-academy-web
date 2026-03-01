import config from 'learn-academy-web/config/environment';

export async function apiRequest(url, options = {}) {
  return fetch(`${config.API_HOST}${url}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
}