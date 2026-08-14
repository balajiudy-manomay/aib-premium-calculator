import { ClientSecretCredential } from "@azure/identity";
import { Client } from "@microsoft/microsoft-graph-client";

const tenantId = process.env.AZURE_TENANT_ID!;
const clientId = process.env.AZURE_CLIENT_ID!;
const clientSecret = process.env.AZURE_CLIENT_SECRET!;
const graphScope = "https://graph.microsoft.com/.default";

const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

let graphClientInstance: Client | null = null;

export async function getGraphClient(): Promise<Client> {
  if (graphClientInstance) {
    return graphClientInstance;
  }

  graphClientInstance = Client.init({
    authProvider: async (done) => {
      try {
        const tokenResponse = await credential.getToken(graphScope);
        done(null, tokenResponse?.token || null);
      } catch (error) {
        done(error as Error, null);
      }
    },
  });

  return graphClientInstance;
}

export async function getGraphToken(): Promise<string> {
  const tokenResponse = await credential.getToken(graphScope);
  return tokenResponse?.token || "";
}
