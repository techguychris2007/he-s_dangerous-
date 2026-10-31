import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProgress } from '../../state/progressStore';
import { useLabsData } from '../../state/useLabsData';
import type { LabEntry } from '../../data/labs';
import CompletionNotice from './CompletionNotice';

function isDone(progress: ReturnType<typeof useProgress>, lab: LabEntry): boolean {
  return progress.flagCount(lab.scenario.id) >= lab.scenario.totalFlags;
}

function findNextLab(progress: ReturnType<typeof useProgress>, roadmapOrder: LabEntry[], justCompletedId: string): LabEntry | null {
  const idx = roadmapOrder.findIndex((l) => l.scenario.id === justCompletedId);
  const rest = idx >= 0 ? roadmapOrder.slice(idx + 1) : roadmapOrder;
  return rest.find((l) => !isDone(progress, l)) ?? roadmapOrder.find((l) => !isDone(progress, l)) ?? null;
}

interface Toast {
  lab: LabEntry;
  nextLab: LabEntry | null;
}

/** Announces newly completed labs without rewarding speed or interrupting the learner's workspace. */
export default function Companion() {
  const progress = useProgress();
  const navigate = useNavigate();
  const labsData = useLabsData();
  const prevCompletedIds = useRef<Set<string> | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!labsData) return; // wait for the async labs chunk — see useLabsData
    const currentCompleted = new Set<string>();
    for (const labId of Object.keys(progress.labFlags)) {
      const lab = labsData.findLab(labId);
      if (lab && (progress.labFlags[labId]?.length ?? 0) >= lab.scenario.totalFlags) {
        currentCompleted.add(labId);
      }
    }

    if (prevCompletedIds.current === null) {
      // Loading historical progress must not invent a completion date. Flag capture records
      // the actual threshold transition; undated legacy records remain explicitly undated.
      prevCompletedIds.current = currentCompleted;
      return;
    }

    const newlyDone = [...currentCompleted].filter((id) => !prevCompletedIds.current!.has(id));
    prevCompletedIds.current = currentCompleted;
    if (newlyDone.length === 0) return;

    const lab = labsData.LABS.find((l) => l.scenario.id === newlyDone[0]);
    if (!lab) return;

    setToast({
      lab,
      nextLab: findNextLab(progress, labsData.LABS_IN_ROADMAP_ORDER, lab.scenario.id),
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.labFlags, labsData]);

  if (!toast) return null;

  return <CompletionNotice
    title={toast.lab.scenario.title}
    completedCount={prevCompletedIds.current?.size ?? 0}
    nextTitle={toast.nextLab?.scenario.title}
    onNext={() => {
      if (!toast.nextLab) return;
      setToast(null);
      navigate(`/lab/${toast.nextLab.slug}`);
    }}
    onDismiss={() => setToast(null)}
  />;
}
