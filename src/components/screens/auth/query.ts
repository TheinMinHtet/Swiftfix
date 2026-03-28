import { GetAuthCode } from "../../../utils/native-apis";
import { loginWithAuthCode } from "../../../../api/auth-api";

export function getAuthCodeAsync(): Promise<string> {
  return new Promise((resolve, reject) => {
    GetAuthCode(
      (code: string) => resolve(code),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err: any) => reject(err),
    );
  });
}

export async function splashLoginAsync(authCode: string) {
  return loginWithAuthCode(authCode);
}
