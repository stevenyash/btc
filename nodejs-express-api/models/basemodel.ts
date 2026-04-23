import {
  Sequelize,
  Model,
  FindOptions,
  Dialect,
  ModelStatic,
  Optional,
  DateDataTypeConstructor,
  IntegerDataTypeConstructor,
  StringDataTypeConstructor,
  Op,
} from "sequelize";
import { Literal } from "sequelize/types/utils.js";

const sequelize = new Sequelize(
  process.env.DB_NAME || 'btc',
  process.env.DB_USERNAME || 'root',
  process.env.DB_PASSWORD || '',
  {
    dialect: (process.env.DB_TYPE || 'mysql') as Dialect,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || '3306'),
    pool: {
      max: 15,
      min: 5,
      idle: 20000,
      evict: 15000,
      acquire: 30000,
    },
    define: {
      timestamps: false,
      freezeTableName: true,
    },
  }
);

class BaseModel<
  TAttributes extends {} = any,
  TCreationAttributes extends {} = TAttributes
> extends Model<TAttributes, TCreationAttributes> {
  static initModel(arg0: { purchase_id: { type: IntegerDataTypeConstructor; primaryKey: boolean; }; package_name: { type: StringDataTypeConstructor; defaultValue: Literal; }; transaction_date: { type: DateDataTypeConstructor; defaultValue: Literal; }; expiry_date: { type: DateDataTypeConstructor; defaultValue: Literal; }; status: { type: StringDataTypeConstructor; defaultValue: Literal; }; }, arg1: { sequelize: Sequelize; tableName: string; modelName: string; }) {
	  throw new Error('Method not implemented.');
  }
  static async findValue(
    this: ModelStatic<Model>,
    column: string,
    where: Record<string, unknown>
  ): Promise<unknown> {
    const row = await this.findOne({ attributes: [column], where });
    return row ? row.get(column) : null;
  }

  static async paginate(
    this: ModelStatic<Model>,
    query: Omit<FindOptions, "offset" | "limit">,
    page: number,
    limit: number
  ): Promise<{
    totalRecords: number;
    recordCount: number;
    totalPages: number;
    records: Model[];
  }> {
    const options: FindOptions = {
      ...query,
      offset: limit * (page - 1),
      limit,
    };

    const result = await this.findAndCountAll(options);
    const totalRecords = result.count;
    const records = result.rows;
    const recordCount = records.length;
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      totalRecords,
      recordCount,
      totalPages,
      records,
    };
  }
}

export { BaseModel, sequelize, Sequelize, Op };
export default { BaseModel, sequelize, Sequelize, Op };
