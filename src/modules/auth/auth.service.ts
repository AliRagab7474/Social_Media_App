import {
  ConfirmEmailDto,
  LoginDto,
  resendConfirmEmailDto,
  SignupDto,
} from "./auth.dto";
import { IUser } from "../../common/interfaces";

import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/utils/exceptions";
import { UserRepository } from "../../DB/repository/user.repository";
import { emailEvent, emailTemplate, sendEmail } from "../../common/utils/email";
import {
  compareHash,
  createNumberOtp,
  Encrypt,
  generateHash,
} from "../../common/security";
import {
  redisService,
  RedisService,
  TokenService,
} from "../../common/services";
import { emailEnum, ProviderEnum } from "../../common/enums";

export class AuthenticationService {
  private userRepository: UserRepository;
  private readonly redis: RedisService;
  private readonly tokenService: TokenService;

  constructor() {
    this.userRepository = new UserRepository();
    this.redis = redisService;
    this.tokenService = new TokenService();
  }

  public async login(data: LoginDto, issuer: string) {
    const { email, password } = data;
    const user = await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: true },
        provider: ProviderEnum.SYSTEM,
      },
    });

    if (!user) {
      throw new NotFoundException("user not signed up");
    }

    if (!user.confirmEmail) {
      throw new BadRequestException("confirm your email before login");
    }

    const verifyPassword = await compareHash({
      plainText: password,
      cipherText: user.password,
    });
    if (!verifyPassword) {
      throw new NotFoundException("wrong credentials");
    }

    return await this.tokenService.createLoginCredentials(user, issuer);
  }

  private async sendEmailOTP({
    email,
    subject,
    title,
  }: {
    email: string;
    subject: emailEnum;
    title: string;
  }): Promise<any> {
    const isBlockedTTL = await this.redis.ttl(
      this.redis.blockedOtpKey({ email, subject }),
    );
    if (isBlockedTTL > 0) {
      throw new BadRequestException(
        `can not resend another otp until unblock after (${isBlockedTTL}) sec`,
      );
    }

    const remainingTime: number = await this.redis.ttl(
      this.redis.otpKey({ email, subject }),
    );
    if (remainingTime > 0) {
      throw new BadRequestException(
        `can not resend another otp until the old otp expires after (${remainingTime}) sec`,
      );
    }

    const maxTrial = await this.redis.get(
      this.redis.maxTrialKey({ email, subject }),
    );
    console.log(maxTrial);

    if (Number(maxTrial) >= 2) {
      await this.redis.set({
        key: this.redis.blockedOtpKey({ email, subject }),
        value: 1,
        ttl: 5 * 60,
      });
    }

    const code = createNumberOtp();
    await this.redis.set({
      key: this.redis.otpKey({ email, subject }),
      value: await generateHash({ plainText: code.toString() }),
      ttl: 120,
    });

    emailEvent.emit("SendEmail", async () => {
      await sendEmail({
        to: email,
        subject: subject,
        html: emailTemplate({ code, title }),
      });

      await this.redis.incr(this.redis.maxTrialKey({ email, subject }));
    });
  }

  public async signup(data: SignupDto): Promise<IUser> {
    const { email, password, phone } = data;
    const checkUserExist = await this.userRepository.findOne({
      filter: { email },
      projection: "email",
    });
    if (checkUserExist) {
      throw new ConflictException("Email Exists");
    }

    data.password = await generateHash({ plainText: password });
    data.phone = await Encrypt({ plainText: phone });

    const result = await this.userRepository.create({ data: data });
    if (!result) {
      throw new BadRequestException("fail");
    }
    // await sendEmail({
    //   to: email,
    //   subject: "confirm email",
    //   html: emailTemplate({ code: 546545, title: "confirm email" }),
    // });

    await this.sendEmailOTP({
      email: email,
      subject: emailEnum.CONFIRM_EMAIL,
      title: "Verify_Email",
    });

    return result.toJSON();
  }

  public async confirmEmail({ email, otp }: ConfirmEmailDto) {
    const account = await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: false },
        provider: ProviderEnum.SYSTEM,
      },
    });

    if (!account) {
      throw new NotFoundException("email not found");
    }

    if (account.confirmEmail) {
      throw new BadRequestException("email already confirmed");
    }

    const hashedOtp = await this.redis.get(
      this.redis.otpKey({ email, subject: emailEnum.CONFIRM_EMAIL }),
    );
    if (!hashedOtp) {
      throw new NotFoundException("Invalid otp");
    }

    if (
      !(await compareHash({ plainText: otp.toString(), cipherText: hashedOtp }))
    ) {
      throw new ConflictException("otp doesn't match");
    }

    account.confirmEmail = new Date();
    await account.save();

    await this.redis.deleteKey(
      await this.redis.Keys(this.redis.otpKey({ email })),
    );

    return;
  }

  public resendOTP = async ({ email }: resendConfirmEmailDto) => {
    const account = await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: false },
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!account) {
      throw new NotFoundException("email not found");
    }
    if (account.confirmEmail) {
      throw new BadRequestException("email already confirmed");
    }

    await this.sendEmailOTP({
      email,
      subject: emailEnum.CONFIRM_EMAIL,
      title: "Verify Email",
    });

    return;
  };
}

export default new AuthenticationService();
