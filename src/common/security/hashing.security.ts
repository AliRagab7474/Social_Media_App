import { hash, compare } from "bcrypt";
import { SALT_ROUND } from "../../config/config";

export const generateHash = async ({
  plainText,
  salt = SALT_ROUND,
}: {
  plainText: string;
  salt?: number;
}) => {
  const cipherText = await hash(plainText, salt);
  return cipherText;
};

export const compareHash = async ({
  plainText,
  cipherText,
}: {
  plainText: string;
  cipherText: string;
}): Promise<boolean> => {
  return await compare(plainText, cipherText);
};
