import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

import {
  getSearchIndex,
  search,
  type SearchFilters,
  type SearchResult,
  type SearchResultType,
} from '~/server/searchIndex';

export type { SearchFilters, SearchResult, SearchResultType };

export type SearchResponse = {
  results: SearchResult[];
  query: string;
  filters: SearchFilters;
  totalCount: number;
  timing: number;
};

export const Route = createFileRoute('/api/search')({
  server: {
    middleware: [],
    handlers: {
      GET: async ({ request }) => {
        const start = Date.now();
        const url = new URL(request.url);
        const query = url.searchParams.get('q') || '';
        const typesParam = url.searchParams.get('types');
        const materialType = url.searchParams.get('materialType') || undefined;
        const brand = url.searchParams.get('brand') || undefined;
        const limit = parseInt(url.searchParams.get('limit') || '50', 10);

        const filters: SearchFilters = {
          types: typesParam
            ? (typesParam.split(',') as SearchResultType[])
            : undefined,
          materialType,
          brand,
        };

        try {
          const index = await getSearchIndex();
          const results = search(index, query, filters, limit);

          const response: SearchResponse = {
            results,
            query,
            filters,
            totalCount: results.length,
            timing: Date.now() - start,
          };

          return json(response);
        } catch (error) {
          console.error('Search error:', error);
          return json({ error: 'Search failed' }, { status: 500 });
        }
      },
    },
  },
});
