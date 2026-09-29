import { useMutation } from "@tanstack/react-query";
import { scanRepository as requestRepositoryScan } from "../api/repositories.api";

const useScanRepository = () => {
  const mutation = useMutation({
    mutationFn: requestRepositoryScan,
  });

  const scanRepository = (repositoryId: string) => {
    mutation.mutate(repositoryId);
  };

  return {
    scanRepository,
    isScanning: mutation.isPending,
    scanError: mutation.error,
    scanSuccess: mutation.isSuccess,
  };
};

export default useScanRepository;
