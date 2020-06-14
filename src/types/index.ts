import * as $protobuf from 'protobufjs';
import { foo } from '@generated/grpc';

type TOmitMethods<T> = {
  [Key in keyof T]?: T[Key] extends Function ? never : T[Key];
};

type TGrpcServiceController<T> = Omit<
  {
    [Key in keyof T]: T[Key] extends (...args: infer A) => Promise<infer R>
      ? TOmitMethods<T[Key]>
      : never;
  },
  keyof $protobuf.rpc.Service
>;

export type TFooController = TGrpcServiceController<foo.FooService>;
