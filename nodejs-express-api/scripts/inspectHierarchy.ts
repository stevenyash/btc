#!/usr/bin/env tsx
import dotenv from 'dotenv';
dotenv.config();

import DB from '../models/db.js';

async function inspectHierarchy() {
  console.log('🔍 Inspecting current learning hierarchy...\n');

  const grades = await DB.Grades.findAll({
    include: [{ model: DB.LearningAreas, as: 'learning_areas', attributes: ['id', 'name'], include: [{ model: DB.Topics, as: 'topics', attributes: ['topic_id', 'name'], include: [{ model: DB.Subtopics, as: 'subtopics', attributes: ['subtopic_id', 'name'] }] }] }],
    raw: true,
    nest: true
  });

  console.log('📚 Current Hierarchy:\n');
  for (const grade of grades) {
    console.log(`Grade ${grade.id}: "${grade.name}"`);
    if (grade.learning_areas) {
      for (const area of grade.learning_areas) {
        console.log(`  Area ${area.id}: "${area.name}"`);
        if (area.topics) {
          for (const topic of area.topics) {
            console.log(`    Topic ${topic.topic_id}: "${topic.name}"`);
            if (topic.subtopics) {
              for (const sub of topic.subtopics) {
                console.log(`      Subtopic ${sub.subtopic_id}: "${sub.name}"`);
              }
            }
          }
        }
      }
    }
  }

  console.log(`\n📊 Total: ${grades.length} grades`);
}

inspectHierarchy().catch(console.error);
