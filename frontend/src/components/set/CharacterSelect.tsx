import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

// Lista de personajes basada en los archivos en public/stock_icons
const CHARACTERS = [
  'mario','luigi','peach','daisy','bowser','bowser_jr','yoshi','donkey_kong','diddy_kong','link','young_link','toon_link',
  'zelda','zelda','sheik','ganondorf','samus','dark_samus','zero_suit_samus','kirby','king_dedede','fox','falco','ness',
  'lucas','captain_falcon','pikachu','pichu','jigglypuff','mewtwo','mr_game_and_watch','pit','dark_pit','palutena','robin',
  'rosalina_and_luma','little_mac','villager','olimar','wario','ness','ice_climbers','wolf','ike','chrom','marth','lucina',
  'ryu','ken','cloud','bayonetta','joker','pac_man','mii_fighter','sephiroth','minmin','sora','terry','steve','ridley','snake',
  'sonic','mega_man','meta_knight','greninja','inkling','roxas'
];

function slugToLabel(slug: string) {
  return slug
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CharacterSelect({
  value,
  onChange,
  disabled = false,
}: {
  value?: string | null;
  onChange: (val: string | null) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState(query);
  const [focused, setFocused] = useState(false);

  // simple debounce implementation local to the component
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const options = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    const filtered = CHARACTERS.filter((c) => {
      if (!q) return true;
      const slug = c.toLowerCase();
      const label = slugToLabel(c).toLowerCase();
      return slug.includes(q) || label.includes(q);
    });
    // dedupe preserving order
    return Array.from(new Set(filtered));
  }, [debounced]);

  return (
    <div className="relative">
      <Input
        placeholder="Buscar personaje..."
        value={focused ? query : value ? slugToLabel(value) : query}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const v = e.target.value;
          setQuery(v);
        }}
        onFocus={() => {
          // when focusing, allow editing the current selection
          if (value && !query) setQuery(slugToLabel(value));
          setFocused(true);
        }}
        onBlur={() => {
          // delay hiding to allow click selection
          setTimeout(() => setFocused(false), 150);
        }}
        disabled={disabled}
      />

      {focused && options.length > 0 && !disabled && (
        <div className="absolute z-50 mt-2 w-full max-h-96 overflow-auto rounded-md border bg-inherit py-2 shadow-lg">
          {options.map((slug) => (
            <button
              key={slug}
              type="button"
              aria-label={slugToLabel(slug)}
              className={cn(
                'flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-muted-foreground/5',
                value === slug && 'bg-muted-foreground/5'
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(slug);
                setQuery('');
                setFocused(false);
              }}
            >
              <img src={`${import.meta.env.BASE_URL}stock_icons/${slug}.png`} alt={slug} className="h-10 w-10 object-contain" />
              <span className="flex-1 text-base text-current truncate">{slugToLabel(slug)}</span>
              {value === slug && <Check className="h-5 w-5 text-success" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CharacterSelect;
