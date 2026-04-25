import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, text } from '@nozbe/watermelondb/decorators';

export class Category extends Model {
  static table = 'categories';

  @text('user_id')    userId!: string;
  @text('name')       name!: string;
  @text('icon')       icon!: string;
  @text('color')      color!: string;
  @text('type')       type!: 'income' | 'expense' | 'both';
  @text('frequency')  frequency!: string;
  @field('is_default') isDefault!: boolean;
  @field('is_synced') isSynced!: boolean;
  @text('server_id')  serverId!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
