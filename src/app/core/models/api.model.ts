export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** Shape of every error returned by the API (see ExceptionHandlingMiddleware). */
export interface ApiErrorDetail {
  errorCode: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any;
}
