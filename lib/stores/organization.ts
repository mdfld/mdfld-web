import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface OrganizationStore {
  activeOrganization: Organization | null;
  setActiveOrganization: (org: Organization | null) => void;
  clearActiveOrganization: () => void;
}

export const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set) => ({
      activeOrganization: null,
      setActiveOrganization: (org) => set({ activeOrganization: org }),
      clearActiveOrganization: () => set({ activeOrganization: null }),
    }),
    {
      name: "organization-storage",
    },
  ),
);
