"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadApproachEnum = exports.multerApproachEnum = void 0;
var multerApproachEnum;
(function (multerApproachEnum) {
    multerApproachEnum[multerApproachEnum["MEMORY"] = 0] = "MEMORY";
    multerApproachEnum[multerApproachEnum["DISK"] = 1] = "DISK";
})(multerApproachEnum || (exports.multerApproachEnum = multerApproachEnum = {}));
var uploadApproachEnum;
(function (uploadApproachEnum) {
    uploadApproachEnum[uploadApproachEnum["SMALL"] = 0] = "SMALL";
    uploadApproachEnum[uploadApproachEnum["LARGE"] = 1] = "LARGE";
})(uploadApproachEnum || (exports.uploadApproachEnum = uploadApproachEnum = {}));
