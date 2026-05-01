import DB from '../models/db.js';
import { Optional, DataTypes } from "sequelize"; 
class LearningHierarchyService {

	// Learning Levels
	async getLearningLevels() {
		try {
			const levels = await DB.LearningLevels.findAll({
				where: { is_active: true },
				order: [['name', 'ASC']],
				raw: true
			});
			return levels;
		} catch (error) {
			console.error('Error getting learning levels:', error);
			throw error;
		}
	}

	async createLearningLevel(levelData: Record<string, any>) {
		try {
			const level = await DB.LearningLevels.create(levelData);
			return level;
		} catch (error) {
			console.error('Error creating learning level:', error);
			throw error;
		}
	}

	// Grades by Level
	async getGradesByLevel(levelId: number) {
		try {
			const grades = await DB.Grades.findAll({
				where: {
					level_id: levelId,
					is_active: true
				},
				order: [['name', 'ASC']],
				raw: true
			});
			return grades;
		} catch (error) {
			console.error('Error getting grades:', error);
			throw error;
		}
	}

	async createGrade(gradeData: Record<string, any>) {
		try {
			const grade = await DB.Grades.create(gradeData);
			return grade;
		} catch (error) {
			console.error('Error creating grade:', error);
			throw error;
		}
	}

	// Learning Areas by Grade
	async getLearningAreasByGrade(gradeId: number) {
		try {
			const areas = await DB.LearningAreas.findAll({
				where: {
					grade_id: gradeId,
					is_active: true
				},
				order: [['name', 'ASC']],
				raw: true
			});
			return areas;
		} catch (error) {
			console.error('Error getting learning areas:', error);
			throw error;
		}
	}

	async createLearningArea(areaData: Record<string, any>) {
		try {
			const area = await DB.LearningAreas.create(areaData);
			return area;
		} catch (error) {
			console.error('Error creating learning area:', error);
			throw error;
		}
	}

	// Lessons by Learning Area
	async getLessonsByArea(areaId: number) {
		try {
			const lessons = await DB.Lessons.findAll({
				where: {
					area_id: areaId,
					is_active: true
				},
				order: [['title', 'ASC']],
				raw: true
			});
			return lessons;
		} catch (error) {
			console.error('Error getting lessons:', error);
			throw error;
		}
	}

	// Topics by Learning Area
	async getTopicsByArea(areaId: number) {
		try {
			const topics = await DB.Topics.findAll({
				where: {
					area_id: areaId
				},
				order: [['topic_id', 'ASC']],
				raw: true
			});
			return topics;
		} catch (error) {
			console.error('Error getting topics:', error);
			throw error;
		}
	}

	// Subtopics by Topic
	async getSubtopicsByTopic(topicId: number) {
		try {
			const subtopics = await DB.Subtopics.findAll({
				where: {
					topic_id: topicId
				},
				order: [['subtopic_id', 'ASC']],
				raw: true
			});
			return subtopics;
		} catch (error) {
			console.error('Error getting subtopics:', error);
			throw error;
		}
	}

	async createLesson(lessonData: Record<string, any>) {
		try {
			const lesson = await DB.Lessons.create(lessonData);
			return lesson;
		} catch (error) {
			console.error('Error creating lesson:', error);
			throw error;
		}
	}

	// Get complete hierarchy with associations
	async getCompleteHierarchy() {
		try {
			const levels = await DB.LearningLevels.findAll({
				where: { is_active: true },
				order: [['name', 'ASC']],
				include: [
					{
						model: DB.Grades,
						as: 'grades',
						where: { is_active: true },
						required: false,
						include: [
							{
								model: DB.LearningAreas,
								as: 'learning_areas',
								where: { is_active: true },
								required: false,
								include: [
									{
										model: DB.Lessons,
										as: 'lessons',
										where: { is_active: true },
										required: false,
										order: [['title', 'ASC']]
									}
								]
							}
						]
					}
				]
			});

			return levels;
		} catch (error) {
			console.error('Error getting complete hierarchy:', error);
			throw error;
		}
	}

	// Get learning path for a lesson
	async getLearningPath(lessonId: number) {
		try {
			const lesson = await DB.Lessons.findOne({
				where: { id: lessonId },
				include: [
					{
						model: DB.LearningAreas,
						as: 'learning_area',
						include: [
							{
								model: DB.Grades,
								as: 'grade_info',
								include: [
									{
										model: DB.LearningLevels,
										as: 'level'
									}
								]
							}
						]
					}
				]
			});

			if (!lesson) return null;

			return {
				level: lesson.learning_area.grade_info.level,
				grade: lesson.learning_area.grade_info,
				area: lesson.learning_area,
				lesson: lesson
			};
		} catch (error) {
			console.error('Error getting learning path:', error);
			throw error;
		}
	}

	// Search across all lessons
	async searchLessons(query: string) {
		try {
			const lessons = await DB.Lessons.findAll({
				where: {
					title: {
						[DB.op.like]: `%${query}%`
					},
					is_active: true
				},
				include: [
					{
						model: DB.LearningAreas,
						as: 'learning_area',
						include: [
							{
								model: DB.Grades,
								as: 'grade_info',
								include: [
									{
										model: DB.LearningLevels,
										as: 'level'
									}
								]
							}
						]
					}
				],
				order: [['title', 'ASC']]
			});

			return lessons;
		} catch (error) {
			console.error('Error searching lessons:', error);
			throw error;
		}
	}
}

export default new LearningHierarchyService();