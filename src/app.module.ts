import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { User } from './users/entities/user.entity';
import { Profile } from './users/entities/profile.entity';
import { UserPreference } from './users/entities/user-preference.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'Ak@877060',
      database: 'Training',
      entities: [User, Profile, UserPreference],
      synchronize: true, // Only for development!
    }),
    TypeOrmModule.forFeature([User, Profile, UserPreference]),
  ],
  controllers: [AppController, UsersController],
  providers: [AppService, UsersService],
})
export class AppModule { }

