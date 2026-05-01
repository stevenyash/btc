import { BaseModel, sequelize, Sequelize } from './basemodel.js';
import { Optional, DataTypes } from "sequelize"; 
type QuestionStatus = 'unanswered' | 'answered';

interface QuestionsAttributes {
	question_id: number;
	question_text: string;
	status: QuestionStatus | null;
	created_at: Date;
	scheduler_id: string | null;
}

interface QuestionsCreationAttributes
	extends Optional<QuestionsAttributes, 'question_id'> {}

class Questions extends BaseModel<QuestionsAttributes, QuestionsCreationAttributes>
	 {

	static initModel() {
		return super.init(
			{
				question_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
				question_text: { type: DataTypes.STRING, allowNull: false, defaultValue: sequelize.literal('DEFAULT') as any },
				status: { type: 'ENUM' as const, values: [] },
				created_at: { type: DataTypes.DATE, allowNull: false },
				scheduler_id: { type: DataTypes.STRING }
			},
			{
				sequelize,
				tableName: "questions",
				modelName: "questions"
			}
		);
	}

	static listFields(): string[] {
		return ["question_text", "status", "question_id"];
	}

	static viewFields(): string[] {
		return ["question_id", "question_text", "status", "created_at", "scheduler_id"];
	}

	static editFields(): string[] {
		return ["question_text", "status", "scheduler_id", "question_id"];
	}

	static searchFields(): (string | ReturnType<typeof sequelize.literal>)[] {
		return [
			sequelize.literal("question_text LIKE :search"),
			sequelize.literal("question_id LIKE :search"),
			sequelize.literal("scheduler_id LIKE :search")
		];
	}
}

Questions.initModel();

export default Questions;
