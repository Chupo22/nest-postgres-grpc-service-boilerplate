import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';
import { string, type, literal, union, Errors, identity } from 'io-ts';
import { fromNullable } from 'io-ts-types/lib/fromNullable';
import { NumberFromString } from 'io-ts-types/lib/NumberFromString';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { fold, map } from 'fp-ts/lib/Either';
import { failure } from 'io-ts/lib/PathReporter';
import { pipe } from 'fp-ts/lib/pipeable';

dotenvConfig();

const Env = type(
  {
    NODE_ENV: fromNullable(
      union([literal('development'), literal('test'), literal('production')]),
      'production',
    ),
    APP_URL: fromNullable(string, 'localhost:3000'),

    POSTGRES_HOST: fromNullable(string, 'localhost'),
    POSTGRES_PORT: fromNullable(NumberFromString, 5432),
    POSTGRES_USER: fromNullable(string, 'postgres'),
    POSTGRES_PASSWORD: fromNullable(string, 'postgres'),
    POSTGRES_DB: fromNullable(string, 'postgres'),
  },
  'TEnv',
);

const env = Env.decode(process.env);

type TEnv = typeof Env._A;

type TAppConfig = {
  appUrl: string;
  isDevelopment: boolean;
};

function getAppConfig(env: TEnv): TAppConfig {
  return {
    appUrl: env.APP_URL,
    isDevelopment: env.NODE_ENV === 'development',
  };
}

export const schemaName = 'foo_schema'; // TODO: Replace me!

export const appConfig = pipe(
  env,
  map(getAppConfig),
  fold((left: Errors) => {
    throw new Error(failure(left).toString());
  }, identity),
);

function getTypeOrmConfig(env: TEnv): PostgresConnectionOptions {
  return {
    type: 'postgres',

    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    username: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB,

    entities: [join(__dirname, join('../**/*.entity.{ts,js}'))],
    namingStrategy: new SnakeNamingStrategy(),

    logging: 'all',
  };
}

export const bootstrapDbConfig = pipe(
  env,
  map(
    (env): PostgresConnectionOptions => ({
      ...getTypeOrmConfig(env),
      schema: schemaName,
    }),
  ),
  fold((left: Errors) => {
    throw new Error(failure(left).toString());
  }, identity),
);

function getMigrationsConfig(env: TEnv) {
  return {
    ...getTypeOrmConfig(env),
    migrationsTableName: 'service_migrations_table_name', // TODO: Replace me!
    migrations: [
      join(__dirname, '../migrations/*'),
      join(__dirname, '../seeds/*'),
    ],
  };
}

export const migrationsConfig = pipe(
  env,
  map(
    (env: TEnv): PostgresConnectionOptions => ({
      ...getMigrationsConfig(env),

      name: 'migrations',
      cli: { migrationsDir: 'src/migrations' },
    }),
  ),
  fold((left: Errors) => {
    throw new Error(failure(left).toString());
  }, identity),
);

export const getSeedsConfig = pipe(
  env,
  map(
    (env: TEnv): PostgresConnectionOptions => ({
      ...getMigrationsConfig(env),
      name: 'seeds',
      cli: { migrationsDir: 'src/seeds' },
    }),
  ),
  fold((left: Errors) => {
    throw new Error(failure(left).toString());
  }, identity),
);
