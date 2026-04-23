import { BaseModel, sequelize, Op } from './basemodel';
import { Optional, DataTypes } from "sequelize"; 

interface TokenBlacklistAttributes {
	id: number;
	jti: string;
	user_id: number;
	expires_at: Date;
	created_at: Date;
}

interface TokenBlacklistCreationAttributes
	extends Optional<TokenBlacklistAttributes, 'id'> {}

class TokenBlacklist extends BaseModel<TokenBlacklistAttributes, TokenBlacklistCreationAttributes> {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				jti: { type: DataTypes.STRING, allowNull: false, unique: true },
				user_id: { type: DataTypes.INTEGER, allowNull: false },
				expires_at: { type: DataTypes.DATE, allowNull: false },
				created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
			},
			{
				sequelize,
				tableName: "token_blacklist",
				modelName: "token_blacklist",
				indexes: [
					{ fields: ['jti'] },
					{ fields: ['expires_at'] }
				]
			}
		);
	}

	static async isBlacklisted(jti: string): Promise<boolean> {
		const token = await TokenBlacklist.findOne({
			where: { jti },
			raw: true
		});
		return !!token;
	}

	static async addToBlacklist(jti: string, userId: number, expiresAt: Date): Promise<void> {
		await TokenBlacklist.create({
			jti,
			user_id: userId,
			expires_at: expiresAt
		});
	}

	static async cleanup(): Promise<number> {
		const result = await TokenBlacklist.destroy({
			where: {
				expires_at: { [Op.lt]: new Date() }
			}
		});
		return result;
	}
}

TokenBlacklist.initModel();

export default TokenBlacklist;