import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login/email')
  postLoginEmail(@Headers('authorization') rawToken: string) {
    const token = this.authService.extractTokenFromHeader(rawToken, false);

    // basic token 형식 = email:password을 base64로 incode해둠 -> decode 해서 각각 추출필요
    const credentials = this.authService.decodeBasicToken(token);
    return this.authService.loginWithEmail(credentials);
  }

  @Post('register/email')
  postRegisterEmail(
    @Body('email') email: string,
    @Body('nickname') nickname: string,
    @Body('password') password: string,
  ) {
    return this.authService.registerWithEmail({ email, nickname, password });
  }

  // 토큰 재발급
  @Post('token/access')
  async postTokenAccess(@Headers('authorization') rawToken: string) {
    const token = this.authService.extractTokenFromHeader(rawToken, true);

    const newToken = await this.authService.rotateToken(token, false);
    /**
     * {accessToken: {new token}} 형태로 반환
     */
    return {
      accessToken: newToken,
    };
  }

  @Post('token/refresh')
  async postTokenRefresh(@Headers('authorization') rawToken: string) {
    const token = this.authService.extractTokenFromHeader(rawToken, true);

    const newToken = await this.authService.rotateToken(token, true);
    /**
     * {accessToken: {new token}} 형태로 반환
     */
    return {
      refreshToken: newToken,
    };
  }
}
