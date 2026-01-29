import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names and tailwind conflicts', () => {
    const result = cn('px-2 py-1', 'px-4', false, undefined, 'text-sm');
    expect(result).toBe('py-1 px-4 text-sm');
  });
});

