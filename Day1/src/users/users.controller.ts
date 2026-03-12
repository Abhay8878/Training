import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post('register')
    async register(@Body() createUserDto: CreateUserProfileDto) {
        return this.usersService.createUserWithProfile(createUserDto);
    }
}
