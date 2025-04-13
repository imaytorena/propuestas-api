import { Controller } from '@nestjs/common';

@Controller()
export class AppController {
  getStatus() {
    return true;
  }
}
