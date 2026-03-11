import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { UserPreference } from './entities/user-preference.entity';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';

@Injectable()
export class UsersService {
    constructor(private dataSource: DataSource) { }

    async createUserWithProfile(userData: CreateUserProfileDto) {
        const queryRunner = this.dataSource.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction('SERIALIZABLE');

        try {
            // STEP 1: Core Data - Save User
            const user = new User();
            user.email = userData.email;
            const savedUser = await queryRunner.manager.save(user);

            // STEP 2: Core Data - Save Profile
            const profile = new Profile();
            profile.fullName = userData.fullName;
            profile.bio = userData.bio ?? '';
            profile.user = savedUser;
            await queryRunner.manager.save(profile);

            // --- SAVEPOINT START ---
            // If the code fails AFTER this point, we will only undo the "Preference" part.
            // But if it failed BEFORE this point, the whole transaction will be killed.
            await queryRunner.query('SAVEPOINT core_registration_complete');

            try {
                // STEP 3: Optional Data - Save Preference
                const preference = new UserPreference();
                preference.theme = userData.theme ?? 'light';
                preference.user = savedUser;

                // You can manually trigger a failure here to test the savepoint:
                // throw new Error("Preference System Offline");

                await queryRunner.manager.save(preference);

            } catch (prefError) {
                // If the preference system fails, we just undo back to our savepoint.
                // The User and Profile are still "Safe" in the transaction staged area.
                console.warn('Preferences failed, but keeping User/Profile. Rolling back to savepoint.');
                await queryRunner.query('ROLLBACK TO SAVEPOINT core_registration_complete');
            }

            // --- TRANSACTION COMMIT ---
            // This persists everything that wasn't rolled back.
            await queryRunner.commitTransaction();

            return {
                message: 'Registration complete (Transaction used Savepoints for Preferences).',
                user: savedUser,
            };

        } catch (err: any) {
            // GLOBAL ROLLBACK:
            // If User or Profile fails, we kill the ENTIRE transaction.
            await queryRunner.rollbackTransaction();
            throw new InternalServerErrorException(
                `Registration failed: ${err.message}. All changes undone.`
            );
        } finally {
            await queryRunner.release();
        }
    }
}
