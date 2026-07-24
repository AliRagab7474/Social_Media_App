"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const exceptions_1 = require("../../common/utils/exceptions");
const user_repository_1 = require("../../DB/repository/user.repository");
const email_1 = require("../../common/utils/email");
const security_1 = require("../../common/security");
const services_1 = require("../../common/services");
const enums_1 = require("../../common/enums");
class AuthenticationService {
    userRepository;
    redis;
    tokenService;
    notify;
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
        this.redis = services_1.redisService;
        this.tokenService = new services_1.TokenService();
        this.notify = new services_1.NotificationService();
    }
    async login({ email, password, FCM }, issuer) {
        const user = await this.userRepository.findOne({
            filter: {
                email,
                confirmEmail: { $exists: true },
                provider: enums_1.ProviderEnum.SYSTEM,
            },
        });
        if (!user) {
            throw new exceptions_1.NotFoundException("user not signed up");
        }
        if (!user.confirmEmail) {
            throw new exceptions_1.BadRequestException("confirm your email before login");
        }
        if (FCM) {
            await this.redis.addFCM(user._id, FCM);
            const tokens = await this.redis.getFCMs(user._id);
            if (tokens?.length) {
                await this.notify.sendNotifications({ tokens, data: { title: "New Login", body: `new login at ${new Date()}` } });
            }
        }
        const verifyPassword = await (0, security_1.compareHash)({
            plainText: password,
            cipherText: user.password,
        });
        if (!verifyPassword) {
            throw new exceptions_1.NotFoundException("wrong credentials");
        }
        return await this.tokenService.createLoginCredentials(user, issuer);
    }
    async sendEmailOTP({ email, subject, title, }) {
        const isBlockedTTL = await this.redis.ttl(this.redis.blockedOtpKey({ email, subject }));
        if (isBlockedTTL > 0) {
            throw new exceptions_1.BadRequestException(`can not resend another otp until unblock after (${isBlockedTTL}) sec`);
        }
        const remainingTime = await this.redis.ttl(this.redis.otpKey({ email, subject }));
        if (remainingTime > 0) {
            throw new exceptions_1.BadRequestException(`can not resend another otp until the old otp expires after (${remainingTime}) sec`);
        }
        const maxTrial = await this.redis.get(this.redis.maxTrialKey({ email, subject }));
        console.log(maxTrial);
        if (Number(maxTrial) >= 2) {
            await this.redis.set({
                key: this.redis.blockedOtpKey({ email, subject }),
                value: 1,
                ttl: 5 * 60,
            });
        }
        const code = (0, security_1.createNumberOtp)();
        await this.redis.set({
            key: this.redis.otpKey({ email, subject }),
            value: await (0, security_1.generateHash)({ plainText: code.toString() }),
            ttl: 120,
        });
        email_1.emailEvent.emit("SendEmail", async () => {
            await (0, email_1.sendEmail)({
                to: email,
                subject: title,
                html: (0, email_1.emailTemplate)({ code, title }),
            });
            await this.redis.incr(this.redis.maxTrialKey({ email, subject }));
        });
    }
    async signup(data) {
        const { email } = data;
        const checkUserExist = await this.userRepository.findOne({
            filter: { email },
        });
        if (checkUserExist) {
            throw new exceptions_1.ConflictException("Email Exists");
        }
        const user = await this.userRepository.createOne({ data: data });
        if (!user) {
            throw new exceptions_1.BadRequestException("fail to create document");
        }
        await this.sendEmailOTP({
            email: email,
            subject: enums_1.emailEnum.CONFIRM_EMAIL,
            title: "CONFIRM_EMAIL",
        });
        return user.toJSON();
    }
    async confirmEmail({ email, otp }) {
        const account = await this.userRepository.findOne({
            filter: {
                email,
                confirmEmail: { $exists: false },
                provider: enums_1.ProviderEnum.SYSTEM,
            },
        });
        if (!account) {
            throw new exceptions_1.NotFoundException("email not found");
        }
        if (account.confirmEmail) {
            throw new exceptions_1.BadRequestException("email already confirmed");
        }
        const hashedOtp = await this.redis.get(this.redis.otpKey({ email, subject: enums_1.emailEnum.CONFIRM_EMAIL }));
        if (!hashedOtp) {
            throw new exceptions_1.NotFoundException("Invalid otp");
        }
        if (!(await (0, security_1.compareHash)({ plainText: otp.toString(), cipherText: hashedOtp }))) {
            throw new exceptions_1.ConflictException("otp doesn't match");
        }
        account.confirmEmail = new Date();
        await account.save();
        await this.redis.deleteKey(await this.redis.Keys(this.redis.otpKey({ email })));
        return;
    }
    resendOTP = async ({ email }) => {
        const account = await this.userRepository.findOne({
            filter: {
                email,
                confirmEmail: { $exists: false },
                provider: enums_1.ProviderEnum.SYSTEM,
            },
        });
        if (!account) {
            throw new exceptions_1.NotFoundException("email not found");
        }
        if (account.confirmEmail) {
            throw new exceptions_1.BadRequestException("email already confirmed");
        }
        await this.sendEmailOTP({
            email,
            subject: enums_1.emailEnum.CONFIRM_EMAIL,
            title: "Verify Email",
        });
        return;
    };
}
exports.AuthenticationService = AuthenticationService;
exports.default = new AuthenticationService();
