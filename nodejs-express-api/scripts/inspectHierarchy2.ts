#!/usr/bin/env tsx
import dotenv from 'dotenv';
dotenv.config();

import DB from '../models/db.js';

async function inspectHierarchy() {
  console.log('🔍 Inspecting current learning hierarchy...\n');

  const grades = await DB.Grades.findAll({
    attributes: ['id', 'name'],
    raw: true
  });

  for (const grade of grades) {
    const areas = await DB.LearningAreas.findAll({
      where: { grade_id: grade.id },
      attributes: ['id', 'name'],
      raw: true
    });

    for (const area of areas) {
      const topics = await DB.Topics.findAll({
        where: { area_id: area.id },
        attributes: ['topic_id', 'name'],
        raw: true
      });

      for (const topic of topics) {
        const subtopics = await DB.Subtopics.findAll({
          where: { topic_id: topic.topic_id },
          attributes: ['subtopic_id', 'name'],
          raw: true
        });

        for (const sub of subtopics) {
          console.log(`Grade: "${grade.name}" (${grade.id}) | Area: "${area.name}" (${area.id}) | Topic: "${topic.name}" (${topic.topic_id}) | Subtopic: "${sub.name}" (${sub.subtopic_id})`);
        }
      }
    }
  }

  const counts = await Promise.all([
    DB.Grades.count(),
    DB.LearningAreas.count(),
    DB.Topics.count(),
    DB.Subtopics.count(),
    DB.Lessons.count()
  ]);

  console.log(`\n📊 Totals: ${counts[0]} grades, ${counts[1]} areas, ${counts[2]} topics, ${counts[3]} subtopics, ${counts[4]} lessons`);
}

inspectHierarchy().catch(console.error);
