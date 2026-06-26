import { useQuery } from "@tanstack/react-query";
import { clientsApi, type Client } from "@/lib/api/commercial";

const PER_PAGE = 500;

const getClientName = (client: Client) => client.nom || `Client #${client.id}`;

export function useAllClients(search?: string) {
  return useQuery({
    queryKey: ["clients", "all", search || ""],
    queryFn: async () => {
      const firstPage = await clientsApi.getAll({
        search: search || undefined,
        page: 1,
        per_page: PER_PAGE,
      });

      const clients: Client[] = Array.isArray(firstPage.data) ? [...firstPage.data] : [];
      const lastPage = Number(firstPage.meta?.last_page || 1);

      for (let page = 2; page <= lastPage; page += 1) {
        const response = await clientsApi.getAll({
          search: search || undefined,
          page,
          per_page: PER_PAGE,
        });
        if (Array.isArray(response.data)) clients.push(...response.data);
      }

      return clients.sort((a, b) => getClientName(a).localeCompare(getClientName(b), "fr"));
    },
    staleTime: 2 * 60 * 1000,
  });
}