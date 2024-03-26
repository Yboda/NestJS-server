import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersModel } from 'src/users/entities/users.entity';
import { HASH_ROUNDS, JWT_SECRET } from './const/auth.const';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * 헤더에서 토큰 추출 로직
   */
  extractTokenFromHeader(header: string, isBearer: boolean) {
    // 'Basic {token}' or 'Bearer {token}' 을 스플릿
    const splitToken = header.split(' ');

    const prefix = isBearer ? 'Bearer' : 'Basic';

    if (splitToken.length !== 2 || splitToken[0] !== prefix) {
      throw new UnauthorizedException('잘못된 토큰입니다!');
    }

    const token = splitToken[1];

    return token;
  }

  /**
   * email:password 형식으로 base64 incode 되어있는 basic token에서 email, password 추출
   */
  decodeBasicToken(base64TokenString: string) {
    const decoded = Buffer.from(base64TokenString, 'base64').toString('utf8');

    const [email, password] = decoded.split(':');

    if (!email || !password) {
      throw new UnauthorizedException('잘못된 유형의 토큰입니다.');
    }

    return {
      email,
      password,
    };
  }

  /**
   * 토큰 재발급 로직
   */
  // 1. 토큰 검증
  verifyToken(token: string) {
    return this.jwtService.verify(token, {
      secret: JWT_SECRET,
    });
  }
  // 2.재발급
  rotateToken(token: string, isRefreshToken: boolean) {
    const decoded = this.jwtService.verify(token, {
      secret: JWT_SECRET,
    });
    /**
     * sub: id
     * email: email,
     * type: 'access' | 'refresh'
     */
    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException(
        '토큰 재발급은 refresh 토큰으로만 가능합니다.',
      );
    }

    return this.signToken(
      {
        ...decoded,
      },
      isRefreshToken,
    );
  }

  /**
   * 로그인 / 회원가입 로직
   *
   * 1) registerWithEmail
   *  - email, nickname, password를 입력받아 사용자 생성 -> access & refresh token 반환 (로그인까지)
   *
   * 2) loginWithEmail
   *  - email, password 입력하면 사용자 검증 -> 검증완료시 access & refresh token 반환
   *
   * 공통함수)
   * authWithEmailAndPassword : 이메일과 아이디 검증하는 로직
   *  1. 사용자가 존재하는지 확인
   *  2. 비밀번호 맞는지 확인
   *  3. 1,2통과시 사용자정보 반환
   *  4. 데이터를 기반으로 토큰 생성 및 반환 ↓
   * signToken :  access & refresh token 만드는 로직
   * loingUser :  access & refresh token 반환하는 로직
   */

  /**
   * < payload에 들어갈 정보 >
   * email, sub(id), type: access or refresh
   */
  signToken(user: Pick<UsersModel, 'email' | 'id'>, isRefreshToken: boolean) {
    const payload = {
      email: user.email,
      sub: user.id,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    return this.jwtService.sign(payload, {
      // @TODO: 추후 config 모듈 구성할 때 env 설정
      secret: JWT_SECRET,
      expiresIn: isRefreshToken ? 3600 : 300,
    });
  }

  loginUser(user: Pick<UsersModel, 'email' | 'id'>) {
    return {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
    };
  }

  async authWithEmailAndPassword(user: Pick<UsersModel, 'email' | 'password'>) {
    const existUser = await this.usersService.getUserByEmail(user.email);

    if (!existUser) {
      throw new UnauthorizedException('존재하지 않는 사용자입니다.');
    }

    /**
     * 파라미터
     *
     * 1) 입력된 비밀번호
     * 2) 기존 해쉬값 (저장되어있는 hash)
     */
    const isPass = await bcrypt.compare(user.password, existUser.password);

    if (!isPass) {
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    }

    return existUser;
  }

  async loginWithEmail(user: Pick<UsersModel, 'email' | 'password'>) {
    // 1. 유저 존재여부, 패스워드 체크
    const existUser = await this.authWithEmailAndPassword(user);
    // 2. access & refresh token 반환
    return this.loginUser(existUser);
  }

  async registerWithEmail(
    user: Pick<UsersModel, 'nickname' | 'email' | 'password'>,
  ) {
    const hash = await bcrypt.hash(user.password, HASH_ROUNDS);

    const newUser = await this.usersService.createUser({
      ...user,
      password: hash,
    });

    return this.loginUser(newUser);
  }
}
