import { PipeTransform } from '@nestjs/common';
import { Any, Errors, identity } from 'io-ts';
import { failure } from 'io-ts/lib/PathReporter';
import { fold } from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { RpcException } from '@nestjs/microservices';
import { status } from 'grpc';

const validate = fold<Errors, unknown, unknown>((left) => {
  throw new RpcException({
    message: 'Validation failed. ' + failure(left),
    code: status.INVALID_ARGUMENT,
  });
}, identity);

export class IoValidationPipe implements PipeTransform<unknown> {
  constructor(private readonly schema: Any) {}

  public transform(value: unknown): unknown {
    return pipe(this.schema.decode(value), validate);
  }
}
