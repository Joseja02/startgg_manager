import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from './useAuth';

vi.mock('@/lib/api', () => ({
  authApi: {
    me: vi.fn(),
  },
}));

const mockUser = {
  id: 1,
  gamerTag: 'Jose',
  role: 'admin',
  startgg_user_id: '99',
};

function createWrapper(initialEntries: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('useAuth', () => {
  it('stores token from URL and loads user', async () => {
    const { authApi } = await import('@/lib/api');
    vi.mocked(authApi.me).mockResolvedValue({ data: mockUser });

    const wrapper = createWrapper(['/oauth/callback?token=abc123']);
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(sessionStorage.getItem('auth_token')).toBe('abc123');
    expect(result.current.user?.gamerTag).toBe('Jose');
  });

  it('clears tokens and redirects on logout', async () => {
    const { authApi } = await import('@/lib/api');
    vi.mocked(authApi.me).mockResolvedValue({ data: mockUser });
    sessionStorage.setItem('auth_token', 'abc123');
    sessionStorage.setItem('mock_admin', '1');

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    const wrapper = createWrapper(['/dashboard']);
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    result.current.logout();

    expect(sessionStorage.getItem('auth_token')).toBe(null);
    expect(sessionStorage.getItem('mock_admin')).toBe(null);
    expect(window.location.href).toBe('/login');

    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });
});

