import { PostgrestQueryBuilder } from '@supabase/postgrest-js';
import { GetResult } from '@supabase/postgrest-js/dist/module/select-query-parser';
import { GenericTable } from '@supabase/postgrest-js/dist/module/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { GenericSchema } from '@supabase/supabase-js/dist/module/lib/types';

import { LoadQueryOps, loadQuery } from './lib/load-query';
import {
  buildMutationFetcherResponse,
  MutationFetcherResponse,
} from './lib/mutation-response';

export type InsertFetcher<T extends GenericTable, R> = (
  input: T['Insert'][]
) => Promise<MutationFetcherResponse<R>[] | null>;

export type InsertFetcherOptions<
  S extends GenericSchema,
  T extends GenericTable
> = Parameters<PostgrestQueryBuilder<S, T>['insert']>[1];

function buildInsertFetcher<
  S extends GenericSchema,
  T extends GenericTable,
  Q extends string = '*',
  R = GetResult<S, T['Row'], Q extends '*' ? '*' : Q>
>(
  qb: PostgrestQueryBuilder<S, T>,
  opts: LoadQueryOps<Q> & InsertFetcherOptions<S, T>
): InsertFetcher<T, R> {
  return async (
    input: T['Insert'][]
  ): Promise<MutationFetcherResponse<R>[] | null> => {
    const query = loadQuery<Q>(opts);
    if (query) {
      const { selectQuery, userQueryPaths, paths } = query;
      const { data } = await qb
        .insert(input as any, opts)
        .select(selectQuery)
        .throwOnError();
      // data cannot be null because of throwOnError()
      return (data as R[]).map((d) =>
        buildMutationFetcherResponse(d, { paths, userQueryPaths })
      );
    }
    await qb.insert(input as any).throwOnError();
    return null;
  };
}

export { buildInsertFetcher };
