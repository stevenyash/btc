import { useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { LearningLevel, Grade, LearningArea } from "@/services/guest";
import { useGuestStore } from "@/stores/useGuestStore";

interface UseSelectionFlowOptions {
  fetchLevels?: boolean;
}

export function useSelectionFlow(options: UseSelectionFlowOptions = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    levels,
    grades,
    areas,
    lessons,
    selectedLevel,
    selectedGrade,
    selectedArea,
    isLoading,
    setSelectedLevel,
    setSelectedGrade,
    setSelectedArea,
    fetchLevels,
    fetchGrades,
    fetchAreas,
    fetchLessons,
  } = useGuestStore();

  // Initialize levels on mount
  useEffect(() => {
    if (options.fetchLevels !== false) {
      fetchLevels();
    }
  }, [fetchLevels, options.fetchLevels]);

  // Handle URL params for level selection
  useEffect(() => {
    const levelParam = searchParams.get("level");
    if (levelParam && levels.length > 0) {
      const levelId = parseInt(levelParam, 10);
      const level = levels.find((l) => l.id === levelId);
      if (level && (!selectedLevel || selectedLevel.id !== levelId)) {
        setSelectedLevel(level);
      }
    }
  }, [searchParams, levels, selectedLevel, setSelectedLevel]);

  // Fetch grades when level changes
  useEffect(() => {
    if (selectedLevel) {
      fetchGrades(selectedLevel.id);
    }
  }, [selectedLevel, fetchGrades]);

  // Fetch areas when grade changes
  useEffect(() => {
    if (selectedGrade) {
      fetchAreas(selectedGrade.id);
    }
  }, [selectedGrade, fetchAreas]);

  // Fetch lessons when area changes
  useEffect(() => {
    if (selectedArea) {
      fetchLessons(selectedArea.id);
    }
  }, [selectedArea, fetchLessons]);

  const handleLevelSelect = useCallback(
    (level: LearningLevel) => {
      if (!level) return;
      setSelectedLevel(level);
      searchParams.set("level", level.id.toString());
      window.history.replaceState(null, "", `?${searchParams.toString()}`);
    },
    [setSelectedLevel, searchParams]
  );

  const handleGradeSelect = useCallback(
    (grade: Grade) => {
      if (!grade) return;
      setSelectedGrade(grade);
      setSelectedArea(null);
    },
    [setSelectedGrade, setSelectedArea]
  );

  const handleAreaSelect = useCallback(
    (area: LearningArea) => {
      if (!area) return;
      setSelectedArea(area);
    },
    [setSelectedArea]
  );

  const handleBackToLevels = useCallback(() => {
    setSelectedLevel(null);
    setSelectedGrade(null);
    setSelectedArea(null);
    setSearchParams({});
  }, [setSelectedLevel, setSelectedGrade, setSelectedArea]);

  const handleBackToGrades = useCallback(() => {
    setSelectedGrade(null);
    setSelectedArea(null);
  }, [setSelectedGrade, setSelectedArea]);

  const handleBackToAreas = useCallback(() => {
    setSelectedArea(null);
  }, [setSelectedArea]);

  return {
    // State
    levels,
    grades,
    areas,
    lessons,
    selectedLevel,
    selectedGrade,
    selectedArea,
    isLoading,

    // Selection handlers
    handleLevelSelect,
    handleGradeSelect,
    handleAreaSelect,
    handleBackToLevels,
    handleBackToGrades,
    handleBackToAreas,
  };
}

export default useSelectionFlow;
