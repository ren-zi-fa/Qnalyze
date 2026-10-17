/**
 * Kode status HTTP yang dipakai API.
 *
 * Nilai dan nama mengikuti registry IANA / RFC 9110 sehingga konsisten dengan
 * standar HTTP (bukan angka literal yang tersebar di kode).
 *
 * @see https://www.rfc-editor.org/rfc/rfc9110#name-status-codes
 * @see https://www.iana.org/assignments/http-status-codes/
 */
export const HttpStatus = {
  // 2xx - Sukses
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // 4xx - Kesalahan dari sisi klien
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 5xx - Kesalahan dari sisi server
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];

/** Status 4xx: request dari klien yang tidak valid. */
export function isClientError(status: number): boolean {
  return status >= 400 && status < 500;
}

/** Status 5xx: kegagalan di sisi server. */
export function isServerError(status: number): boolean {
  return status >= 500 && status < 600;
}
