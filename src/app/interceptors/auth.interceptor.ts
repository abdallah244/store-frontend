import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Prefer adminId if present; else use userId
  const adminId = localStorage.getItem('adminId');
  const userId = localStorage.getItem('userId');

  const idToSend = adminId || userId;
  if (idToSend) {
    const clonedReq = req.clone({
      setHeaders: {
        'x-user-id': idToSend
      }
    });
    return next(clonedReq);
  }

  return next(req);
};
