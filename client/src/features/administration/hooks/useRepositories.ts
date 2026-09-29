import { useQuery } from "@tanstack/react-query";
import { fetchScannableRepositories } from "../api/repositories.api";

export const useRepositories = () => {
  return useQuery({
    queryKey: ["repositories"],
    queryFn: fetchScannableRepositories,
  });
};
