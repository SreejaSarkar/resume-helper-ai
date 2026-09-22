import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

const databaseConfig = process.env.DATABASE_URL
  ? {
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    };

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...databaseConfig,
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
})
export class DatabaseModule {}
