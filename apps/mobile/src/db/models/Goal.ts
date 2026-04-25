import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, text } from '@nozbe/watermelondb/decorators';

export class Goal extends Model {
  static table = 'goals';

  @text('user_id')        userId!: string;
  @text('name')           name!: string;
  @field('target_amount') targetAmount!: number;
  @field('current_amount') currentAmount!: number;
  @text('currency')       currency!: string;
  @field('deadline')      deadline!: number;
  @text('type')           type!: 'savings' | 'debt' | 'emergency' | 'investment' | 'custom';
  @field('is_completed')  isCompleted!: boolean;
  @field('is_synced')     isSynced!: boolean;
  @text('server_id')      serverId!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;

  get progressPercent(): number {
    if (this.targetAmount === 0) return 0;
    return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
  }
}
