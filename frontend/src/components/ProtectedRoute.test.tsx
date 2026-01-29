import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function renderWithRoutes(element: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={element} />
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/dashboard" element={<div>dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('shows loading skeleton while auth is loading', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      logout: vi.fn(),
    });

    const { container } = renderWithRoutes(
      <ProtectedRoute>
        <div>private</div>
      </ProtectedRoute>
    );

    expect(container.querySelector('.h-64')).toBeTruthy();
  });

  it('redirects unauthenticated users to login', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      logout: vi.fn(),
    });

    renderWithRoutes(
      <ProtectedRoute>
        <div>private</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('redirects non-admin users when admin is required', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, gamerTag: 'Jose', role: 'competitor', startgg_user_id: '99' },
      logout: vi.fn(),
    });

    renderWithRoutes(
      <ProtectedRoute requireAdmin>
        <div>private</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('renders children for authenticated users', () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { id: 1, gamerTag: 'Jose', role: 'admin', startgg_user_id: '99' },
      logout: vi.fn(),
    });

    renderWithRoutes(
      <ProtectedRoute>
        <div>private</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('private')).toBeInTheDocument();
  });
});

