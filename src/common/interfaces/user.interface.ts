import { Types } from "mongoose";
import { GenderEnum, ProviderEnum, RoleEnum } from "../enums";

export interface IUser {
  firstName: String;
  lastName: string;
  slug?:string;
  username?: string;
  email: string;
  password: string;

  phone?: string;
  profilePicture?: string;
  profileCoverPictures?: string[];

  friends?:Types.ObjectId[] | [];

  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;

  changeCredentialsTime?: Date;
  DOB?: Date;
  confirmEmail?: Date;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
}
