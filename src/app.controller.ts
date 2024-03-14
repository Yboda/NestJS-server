import { Controller } from '@nestjs/common';
import { AppService } from './app.service';

/* 컨트롤러 자체에 path를 넣어주면 해당 컨트롤러 
안의 모든 엔드포인트 앞에 해당 path를 붙이는 역할을 한다 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
}
