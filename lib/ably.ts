import * as Ably from "ably";

export const ABLY_CHANNEL = "meridian:workspace";

export function ablyRest() {
  const key = process.env.ABLY_API_KEY;
  if (!key) return null;
  return new Ably.Rest({ key });
}

export async function publishWorkspaceEvent(name: string, data: Record<string, unknown>) {
  const client = ablyRest();
  if (!client) return false;
  try {
    await client.channels.get(ABLY_CHANNEL).publish(name, data);
    return true;
  } catch (error) {
    console.error("Ably publish failed", error);
    return false;
  }
}
