// src/api/utils/HeadersApi.ts

export type HeaderMap = Record<string, string>

class HeadersApi {
  async authHeaders(
    token: string | null = null,
    cookie?: string,
    extraHeaders: HeaderMap = {}
  ): Promise<HeaderMap> {
    return {
  'Content-Type': 'application/json',
  Accept: 'application/json',
  ...extraHeaders,
  ...(token
    ? { Authorization: `Bearer ${token}` }
    : cookie
    ? { Cookie: cookie }
    : {}),
};
  }
}

export default new HeadersApi()