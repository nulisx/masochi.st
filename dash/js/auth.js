// Small auth helper for clients that may use Authorization header instead of cookies.
export function getTokenFromCookie(name = 'token') {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getAuthHeader() {
  const t = getTokenFromCookie();
  if (t) return { Authorization: `Bearer ${t}` };
  return {};
}

export function addAuthHeaders(headers = {}) {
  const h = Object.assign({}, headers);
  const auth = getAuthHeader();
  return Object.assign(h, auth);
}
