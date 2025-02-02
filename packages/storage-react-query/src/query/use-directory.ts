import { fetchDirectory } from '@supabase-cache-helpers/storage-fetcher';
import { FileObject, StorageError } from '@supabase/storage-js';
import {
  useQuery as useReactQuery,
  UseQueryResult as UseReactQueryResult,
  UseQueryOptions as UseReactQueryOptions,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import { StorageFileApi, encode } from '../lib';

/**
 * Convenience hook to fetch a directory from Supabase Storage using React Query.
 *
 * @param fileApi The StorageFileApi instance.
 * @param path The path to the directory.
 * @param config The React Query configuration.
 * @returns An UseQueryResult containing an array of FileObjects
 */
function useDirectory(
  fileApi: StorageFileApi,
  path: string,
  config?: Omit<
    UseReactQueryOptions<FileObject[] | undefined, StorageError>,
    'queryKey' | 'queryFn'
  >
): UseReactQueryResult<FileObject[] | undefined, StorageError> {
  const fetcher = useCallback(
    () => fetchDirectory(fileApi, path),
    [fileApi, path]
  );
  return useReactQuery(encode([fileApi, path]), fetcher, config);
}

export { useDirectory };
