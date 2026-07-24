"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postAvailability = void 0;
const enums_1 = require("../enums");
const postAvailability = (user) => {
    return [
        { availability: enums_1.AvailabilityEnum.PUBLIC },
        { availability: enums_1.AvailabilityEnum.ONLY_ME, createdBy: user._id },
        {
            availability: enums_1.AvailabilityEnum.FRIENDS,
            createdBy: { $in: [user._id, ...(user.friends || [])] },
        },
        { tags: { $in: [user._id] } },
    ];
};
exports.postAvailability = postAvailability;
