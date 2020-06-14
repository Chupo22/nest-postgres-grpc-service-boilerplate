import { Controller, UsePipes } from '@nestjs/common';
import { FooService } from '@services';
import { GetFooListRequestDTO, TGetFooListRequestDTO } from '@dto';
import { IoValidationPipe } from '@libs';
import { GrpcMethod } from '@nestjs/microservices';
import { foo as grpc } from '@generated/grpc';
import { TFooController } from '@types';

@Controller()
export class AppController implements TFooController {
  constructor(private readonly fooService: FooService) {}

  @GrpcMethod('FooService')
  @UsePipes(new IoValidationPipe(GetFooListRequestDTO))
  async getFooList(
    request: TGetFooListRequestDTO,
  ): Promise<grpc.IGetFooListResponse> {
    return { result: await this.fooService.find(request) };
  }
}
