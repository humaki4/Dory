import { ApiError, requestJson } from "@/api/httpClient";
import type { ScannableRepositoriesResponse } from "../model/repository.types";

function administrationError(error: unknown, fallback: string): Error {
  if (error instanceof ApiError && error.status === 401) {
    return new Error("Authentication required");
  }
  if (error instanceof ApiError && error.status === 403) {
    return new Error("Administration access required");
  }
  return error instanceof Error ? error : new Error(fallback);
}

export async function fetchScannableRepositories() {
  try {
    return await requestJson<ScannableRepositoriesResponse>(
      "/api/collector/repositories",
    );
  } catch (error) {
    throw administrationError(error, "Failed to load repositories");
  }
}

export async function scanRepository(repositoryId: string): Promise<void> {
  try {
    await requestJson<void>(
      `/api/collector/repositories/${repositoryId}/scan`,
      { method: "POST" },
    );
  } catch (error) {
    throw administrationError(error, "Failed to scan repository");
  }
}
