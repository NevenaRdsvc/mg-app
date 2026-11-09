import { HttpErrorResponse } from '@angular/common/http';
import { describeError, getErrorMessages } from './api-error';

describe('api-error', () => {
  it('describes insufficient stock with its params', () => {
    const message = describeError({
      errorCode: 'InsufficientStock',
      params: { productId: 3, requested: 10, available: 2 },
    });
    expect(message).toBe('Not enough stock for product #3: requested 10, available 2.');
  });

  it('maps every detail in an API error array', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: [
        { errorCode: 'ProductInactive', params: { productId: 1 } },
        { errorCode: 'EmptyOrder' },
      ],
    });
    expect(getErrorMessages(error).length).toBe(2);
  });

  it('explains when the API is unreachable', () => {
    const error = new HttpErrorResponse({ status: 0 });
    expect(getErrorMessages(error)[0]).toContain('Cannot reach the API');
  });
});
