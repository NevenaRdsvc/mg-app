import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorDetail } from '../models/api.model';

/** Turns an API error response into human readable messages. */
export function getErrorMessages(error: unknown): string[] {
  if (!(error instanceof HttpErrorResponse)) {
    return ['Unexpected error.'];
  }

  if (error.status === 0) {
    return ['Cannot reach the API. Is the backend running?'];
  }

  if (error.status === 403) {
    return ["You don't have permission to do this. Ask an admin."];
  }

  if (Array.isArray(error.error) && error.error.length > 0) {
    return (error.error as ApiErrorDetail[]).map(describeError);
  }

  return [`Request failed (${error.status}).`];
}

export function describeError(detail: ApiErrorDetail): string {
  const p = detail.params ?? {};

  switch (detail.errorCode) {
    case 'ValidationFailed':
      return `${p.field}: ${(p.errors ?? []).join(' ')}`;
    case 'CustomerNotFound':
      return `Customer #${p.id} was not found.`;
    case 'ProductNotFound':
      return `Product #${p.productId ?? p.id} was not found.`;
    case 'OrderNotFound':
      return `Order #${p.id} was not found.`;
    case 'EmailAlreadyExists':
      return `A customer with email ${p.email} already exists.`;
    case 'SkuAlreadyExists':
      return `A product with SKU ${p.sku} already exists.`;
    case 'CustomerHasOrders':
      return 'This customer has orders and cannot be deleted.';
    case 'ProductInactive':
      return `Product #${p.productId} is inactive and cannot be ordered.`;
    case 'InsufficientStock':
      return `Not enough stock for product #${p.productId}: requested ${p.requested}, available ${p.available}.`;
    case 'EmptyOrder':
      return 'An order must contain at least one item.';
    case 'InvalidStatusTransition':
      return `Cannot change status from ${p.from} to ${p.to}.`;
    case 'InvalidCredentials':
      return 'Incorrect email or password.';
    case 'AccountLocked':
      return 'Too many failed attempts. Try again in a few minutes.';
    case 'InternalServerError':
      return `Server error. ${p.details ?? ''} (trace: ${p.traceId ?? 'n/a'})`;
    default:
      return detail.errorCode;
  }
}
