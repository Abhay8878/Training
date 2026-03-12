import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_preferences')
export class UserPreference {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ default: 'light' })
    theme!: string;

    @Column({ default: true })
    notificationsEnabled!: boolean;

    @OneToOne(() => User)
    @JoinColumn()
    user!: User;
}
