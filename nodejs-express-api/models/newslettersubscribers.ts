import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
type NewsletterStatus = 'subscribed' | 'unsubscribed';

interface NewsletterSubscribersAttributes {
	id: number;
	email: string;
	name: string | null;
	subscribed_at: Date | null;
	status: NewsletterStatus;
	phone: string | null;
}

interface NewsletterSubscribersCreationAttributes
	extends Optional<NewsletterSubscribersAttributes, 'id' | 'name' | 'subscribed_at' | 'phone'> {}

class NewsletterSubscribers extends BaseModel<NewsletterSubscribersAttributes, NewsletterSubscribersCreationAttributes>
	 {

	static initModel() {
		return super.init(
			{
				id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				email: {
					type: DataTypes.STRING,
					allowNull: false,
					defaultValue: sequelize.literal('DEFAULT') as any
				},
				name: { type: DataTypes.STRING },
				subscribed_at: { type: DataTypes.DATE },
				status: { type: 'ENUM' as const, values: [] },
				phone: { type: DataTypes.STRING }
			},
			{
				sequelize,
				tableName: "newsletter_subscribers",
				modelName: "newsletter_subscribers"
			}
		);
	}

	static listFields(): string[] {
		return ['id', 'email', 'name', 'subscribed_at', 'status', 'phone'];
	}

	static viewFields(): string[] {
		return ['id', 'email', 'name', 'subscribed_at', 'status', 'phone'];
	}

	static editFields(): string[] {
		return ['email', 'name', 'phone', 'id'];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("id LIKE :search"),
			sequelize.literal("email LIKE :search"),
			sequelize.literal("name LIKE :search"),
			sequelize.literal("phone LIKE :search")
		];
	}
}

NewsletterSubscribers.initModel();

export default NewsletterSubscribers;

