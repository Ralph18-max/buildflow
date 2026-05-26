import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('buildflow_token');

  let headers = req.headers;

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  // withFetch() uses the browser Fetch API which caches GET responses by default.
  // Force revalidation so mutations are immediately visible without F5.
  if (req.method === 'GET') {
    headers = headers
      .set('Cache-Control', 'no-cache, no-store')
      .set('Pragma', 'no-cache');
  }

  return next(req.clone({ headers }));
};
