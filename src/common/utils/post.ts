import { HydratedDocument } from "mongoose";
import { AvailabilityEnum } from "../enums";
import { IUser } from "../interfaces";

export const postAvailability = (user: HydratedDocument<IUser>) => {
  return [
    { availability: AvailabilityEnum.PUBLIC },
    { availability: AvailabilityEnum.ONLY_ME, createdBy: user._id },
    {
      availability: AvailabilityEnum.FRIENDS,
      createdBy: { $in: [user._id, ...(user.friends || [])] },
    },
    { tags: { $in: [user._id] } },
  ];
};
