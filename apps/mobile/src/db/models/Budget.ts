import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, text } from '@nozbe/watermelondb/decorators';

export class Budget extends Model {
  static table = 'budgets';

  @text('user_id')     userId!: string;
  @text('category_id') categoryId!: string;
  @field('amount')     amount!: number;
  @text('currency')    currency!: string;
  @text('period')      period!: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  @field('is_active')  isActive!: boolean;
  @field('is_synced')  isSynced!: boolean;
  @text('server_id')   serverId!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
