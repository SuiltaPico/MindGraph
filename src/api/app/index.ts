import { IClient } from "../client/type";

async function load_mg(client: IClient, path: string) {
  return await client.invoke("app/load_mg", { path });
}

export { load_mg };
