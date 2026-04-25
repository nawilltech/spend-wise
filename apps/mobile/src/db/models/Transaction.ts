import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, text } from '@nozbe/watermelondb/decorators';

export class Transaction extends Model {
  static table = 'transactions';

  @text('user_id')       userId!: string;
  @text('type')          type!: 'income' | 'expense';
  @field('amount')       amount!: number;
  @text('currency')      currency!: string;
  @field('base_amount')  baseAmount!: number;
  @text('base_currency') baseCurrency!: string;
  @text('category_id')   categoryId!: string;
  @text('description')   description!: string;
  @text('note')          note!: string;
  @text('voice_input')   voiceInput!: string;
  @field('transaction_date') transactionDate!: number;
  @field('is_synced')    isSynced!: boolean;
  @text('server_id')     serverId!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
}
