import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AuthCallback from './AuthCallback';

function renderWithRoute(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/oauth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/login" element={<div>Login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AuthCallback', () => {
  it('redirects to dashboard when token is present', async () => {
    renderWithRoute('/oauth/callback?token=abc123');

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('redirects to login when error is present', async () => {
    renderWithRoute('/oauth/callback?error=invalid_state');

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });

  it('redirects to login when token is missing', async () => {
    renderWithRoute('/oauth/callback');

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });
});

