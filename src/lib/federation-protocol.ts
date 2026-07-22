import { HttpError } from "./http";

export function assertFederationEventOrigin(remoteInstanceId: string | null, claimedOriginInstanceId: string) {
  if (!remoteInstanceId || claimedOriginInstanceId !== remoteInstanceId) {
    throw new HttpError(403, "Federācijas notikuma izcelsme neatbilst parakstītājai instancei.");
  }
}
