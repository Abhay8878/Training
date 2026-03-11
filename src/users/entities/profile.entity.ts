import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('profiles')
export class Profile {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    fullName!: string;

    @Column({ nullable: true })
    bio!: string;

    @OneToOne(() => User, (user: any) => user.profile)
    @JoinColumn()
    user!: User;
}
