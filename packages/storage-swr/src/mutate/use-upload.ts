import {
  FileInput,
  createUploadFetcher,
  UploadFetcherConfig,
  UploadFileResponse,
} from '@supabase-cache-helpers/storage-fetcher';
import { mutatePaths } from '@supabase-cache-helpers/storage-mutate';
import { StorageError } from '@supabase/storage-js';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import useSWRMutation, {
  SWRMutationResponse,
  SWRMutationConfiguration,
} from 'swr/mutation';

import { decode, getBucketId, StorageFileApi, truthy } from '../lib';
import { useRandomKey } from './use-random-key';

export type { UploadFetcherConfig, UploadFileResponse, FileInput };

/**
 * The input object for the useUpload mutation function.
 * @typedef {Object} UseUploadInput
 * @property {FileList|(File|FileInput)[]} files - The file(s) to be uploaded
 * @property {string} [path] - The path in the storage bucket to upload the file(s) to
 */
export type UseUploadInput = {
  files: FileList | (File | FileInput)[];
  path?: string;
};

/**
 * Hook for uploading files to storage using SWR mutation
 * @param {StorageFileApi} fileApi - The Supabase Storage API
 * @param {UploadFetcherConfig & SWRMutationConfiguration<UploadFileResponse[], StorageError, UseUploadInput, string>} [config] - The SWR mutation configuration
 * @returns {SWRMutationResponse<UploadFileResponse[], StorageError, UseUploadInput, string>} - The SWR mutation response object
 */
function useUpload(
  fileApi: StorageFileApi,
  config?: UploadFetcherConfig &
    SWRMutationConfiguration<
      UploadFileResponse[],
      StorageError,
      UseUploadInput,
      string
    >
): SWRMutationResponse<
  UploadFileResponse[],
  StorageError,
  UseUploadInput,
  string
> {
  const key = useRandomKey();
  const { cache, mutate } = useSWRConfig();
  const fetcher = useCallback(createUploadFetcher(fileApi, config), [
    config,
    fileApi,
  ]);
  return useSWRMutation<
    UploadFileResponse[],
    StorageError,
    string,
    UseUploadInput
  >(
    key,
    async (_, { arg: { files, path } }) => {
      const result = await fetcher(files, path);
      await mutatePaths(
        getBucketId(fileApi),
        result.map(({ data }) => data?.path).filter(truthy),
        {
          cacheKeys: Array.from(cache.keys()),
          decode,
          mutate,
        }
      );
      return result;
    },
    config
  );
}

export { useUpload };
