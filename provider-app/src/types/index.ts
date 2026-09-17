export type RootStackParamList = {
  ProviderSplash: undefined;
  ProviderLogin: undefined;
  ProviderRegister: undefined;
  ProviderHome: { vendorStatus?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' } | undefined;
};

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}
