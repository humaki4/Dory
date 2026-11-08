import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addPublicRepository as requestAddPublicRepository } from "../api/repositories.api";

export function useAddPublicRepository() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: requestAddPublicRepository,
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["repositories"] }),
        queryClient.invalidateQueries({ queryKey: ["search"] }),
      ]);
    },
  });

  return {
    addPublicRepository: mutation.mutate,
    isAdding: mutation.isPending,
    addError: mutation.error,
    addResult: mutation.data,
  };
}
