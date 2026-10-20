/** Tipos serializables compartidos por el servidor y los componentes de conexión (cliente o servidor). */
export interface Option {
  value: string;
  label: string;
}

export interface ConnectionDetails {
  demo: boolean;
  google: {
    configured: boolean;
    connected: boolean;
    status: string | null;
    account: string | null;
    error: string | null;
    lastSync: string | null;
    gscProperty: string | null;
    ga4Property: string | null;
    gscOptions: Option[];
    ga4Options: Option[];
    listError: string | null;
  };
  meta: {
    configured: boolean;
    connected: boolean;
    status: string | null;
    account: string | null;
    error: string | null;
    pageId: string | null;
    pageName: string | null;
    igUsername: string | null;
    pageOptions: Option[];
    listError: string | null;
  };
  reddit: { configured: boolean; connected: boolean; status: string | null; account: string | null; error: string | null };
}
